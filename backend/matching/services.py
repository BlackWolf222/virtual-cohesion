from django.db.models import Q
from django.utils import timezone

from meetings.models import Meeting
from surveys.models import SurveyResponse

from .models import AvailabilitySlot, ConnectionMatch


def _normalize_pair(user_a, user_b):
    return (user_a, user_b) if user_a.id < user_b.id else (user_b, user_a)


def _overlap(slot_a, slot_b):
    start = max(slot_a.starts_at, slot_b.starts_at)
    end = min(slot_a.ends_at, slot_b.ends_at)
    if start < end:
        return start, end
    return None, None


def run_matching_for_tenant():
    users = list(
        SurveyResponse.objects.select_related("user").prefetch_related("hobbies").filter(user__is_active=True)
    )
    created_matches = []
    now = timezone.now()

    for i, response_a in enumerate(users):
        for response_b in users[i + 1 :]:
            user_a = response_a.user
            user_b = response_b.user
            if user_a.department == user_b.department:
                continue

            pair_a, pair_b = _normalize_pair(user_a, user_b)
            if ConnectionMatch.objects.filter(
                Q(user_one=pair_a, user_two=pair_b) | Q(user_one=pair_b, user_two=pair_a)
            ).exists():
                continue

            shared_hobbies = set(response_a.hobbies.values_list("name", flat=True)).intersection(
                set(response_b.hobbies.values_list("name", flat=True))
            )
            if not shared_hobbies:
                continue

            slots_a = AvailabilitySlot.objects.filter(user=user_a, ends_at__gt=now)
            slots_b = AvailabilitySlot.objects.filter(user=user_b, ends_at__gt=now)

            selected_overlap = None
            for slot_a in slots_a:
                for slot_b in slots_b:
                    start, end = _overlap(slot_a, slot_b)
                    if start and end:
                        selected_overlap = (start, end)
                        break
                if selected_overlap:
                    break
            if not selected_overlap:
                continue

            match = ConnectionMatch.objects.create(
                user_one=pair_a,
                user_two=pair_b,
                shared_hobby=sorted(shared_hobbies)[0],
                overlap_start=selected_overlap[0],
                overlap_end=selected_overlap[1],
                score=float(len(shared_hobbies)),
            )
            Meeting.objects.create(
                match=match,
                organizer=pair_a,
                participant=pair_b,
                starts_at=selected_overlap[0],
                ends_at=selected_overlap[1],
                video_url=f"https://virtual-cohesion.local/room/{match.id}",
            )
            created_matches.append(match)
    return created_matches
