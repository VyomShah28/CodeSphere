from django.shortcuts import render, redirect, get_object_or_404, redirect
from .models import Challenges, Contest, User, Rank
from django.urls import reverse
import json
from bs4 import BeautifulSoup
from django.http import Http404, JsonResponse, HttpResponse, HttpResponseRedirect
import re
from django.utils.dateformat import time_format
from compiler.models import Score
from requests import get as httprequests
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from google_auth_oauthlib.flow import Flow
import os
from urllib.parse import urlencode
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import parser_classes
from .serializers import ContestSerializer, ChallengeSerializer
import uuid
import datetime



os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

flow = Flow.from_client_secrets_file(
    client_secrets_file="client_secret.json",
    scopes=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ],
    redirect_uri="http://127.0.0.1:8000/auth/google/callback/",
)

# user login and authentication


def Login(request):
    authorization_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true"
    )
    request.session["oauth_state"] = state
    return redirect(authorization_url)


def google_callback(request):
    state = request.session.get("oauth_state")
    if state is None or state != request.GET.get("state"):
        return HttpResponse({"error": "Invalid state parameter."}, status=400)

    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    flow = Flow.from_client_secrets_file(
        client_secrets_file="client_secret.json",
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        redirect_uri="http://127.0.0.1:8000/auth/google/callback/",
    )

    try:
        flow.fetch_token(authorization_response=request.build_absolute_uri())
        creds = flow.credentials

        user_info_response = httprequests(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {creds.token}"},
        )
        user_info = user_info_response.json()
        email = user_info.get("email")
        full_name = user_info.get("name")
        photo_url = user_info.get("picture")

        if not email:
            return HttpResponse({"error": "Email not provided by Google."}, status=400)

        user, created = User.objects.get_or_create(
            email=email, defaults={"full_name": full_name, "profile_photo": photo_url}
        )

        request.session["user_id"] = user.id
        request.session.set_expiry(timedelta(days=7))

        params = {"id": user.id, "url": photo_url, "full_name": full_name}

        query_string = urlencode(params)

        return HttpResponseRedirect(f"http://localhost:3000/dashboard?{query_string}")

    except Exception as e:
        return HttpResponse(
            f"<h3>OAuth Callback Error</h3><pre>{str(e)}</pre>", status=500
        )


# contest


@api_view(["PUT", "POST"])
def create_contest(request):
    if request.method != "POST":
        id = request.GET.get("contestId")
        print(id)
        data = request.data.get("editedData")
        contest = Contest.objects.get(id=id)
        contest.contest_name = data.get("contest_name")
        contest.description = data.get("description", "")
        contest.start_date = data.get("start_date")
        contest.start_time = data.get("start_time")
        contest.end_date = data.get("end_date")
        contest.end_time = data.get("end_time")
        contest.is_public = data.get("is_public", True)
        contest.number_of_entries = int(data.get("number_of_entries", 2147483647))
        contest.created_at = datetime.datetime.now()
        contest.save()

        return Response(status=status.HTTP_200_OK)
    try:
        user_id = request.data.get("userId")
        user = get_object_or_404(User, id=user_id)

        max_entries = request.data.get("maxEntries", "")
        number_of_entries = int(max_entries) if max_entries.strip() else 2147483647

        link = "http://localhost:3000/"

        contest = Contest.objects.create(
            user=user,
            contest_name=request.data.get("name"),
            description=request.data.get("description", ""),
            start_date=request.data.get("startDate"),
            start_time=request.data.get("startTime"),
            end_date=request.data.get("endDate"),
            end_time=request.data.get("endTime"),
            is_public=request.data.get("isPublic", True),
            number_of_entries=number_of_entries,
            created_at=datetime.datetime.now(),
        )

        random_slug = uuid.uuid4().hex[:8]
        link += f"contest/{random_slug}/?contest={contest.id}"

        contest.link = link
        contest.save()

        return Response(ContestSerializer(contest).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_contests(request):
    userId = request.GET.get("userId")
    print(userId)
    user = get_object_or_404(User, id=userId)
    contests = Contest.objects.filter(user=user)

    user_contest = []

    for contest in contests:
        start_dt = datetime.datetime.strptime(
            f"{contest.start_date} {contest.start_time}", "%Y-%m-%d %H:%M:%S"
        )
        end_dt = datetime.datetime.strptime(
            f"{contest.end_date} {contest.end_time}", "%Y-%m-%d %H:%M:%S"
        )
        now = datetime.datetime.now()

        if now < start_dt:
            status_str = "upcoming"
        elif now > end_dt:
            status_str = "completed"
        else:
            status_str = "active"

        val = {
            "id": contest.id,
            "name": contest.contest_name,
            "description": contest.description,
            "startDate": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "endDate": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "participants": contest.participants,
            "status": status_str,
            "link": contest.link,
            "challenges": Challenges.objects.filter(
                contest=get_object_or_404(Contest, id=contest.id)
            ).count(),
        }
        user_contest.append(val)

    return Response({"data": user_contest}, status=status.HTTP_200_OK)


@api_view(["POST"])
def delete_contest_api(request):
    data = request.body.decode("utf-8")
    data = json.loads(data)
    deleted_contests = data["ids"]
    if deleted_contests:
        Contest.objects.filter(id__in=deleted_contests).delete()

    return Response({"status": "ok", "deleted": deleted_contests})


@api_view(["GET"])
def contest_details(request):
    contest_id = request.GET.get("contestId")
    contest = get_object_or_404(Contest, id=contest_id)
    print(ContestSerializer(contest).data)
    return Response(ContestSerializer(contest).data, status=status.HTTP_200_OK)


# challenge editor


@api_view(["POST"])
@parser_classes([MultiPartParser])
def challenge_editor(request):
    try:
        contest_id = request.data.get("contest_id")
        contest = get_object_or_404(Contest, id=contest_id)
        idx = 0
        while True:
            prefix = f"challenges[{idx}]"
            name = request.data.get(f"{prefix}[challenge_name]")
            if not name:
                break
            id = request.data.get(f"{prefix}[id]")
            try:
                challenge = get_object_or_404(Challenges, id=id)
                challenge.contest = contest
                challenge.challenge_name = name
                challenge.max_score = request.data.get(f"{prefix}[max_score]")
                challenge.difficulty_level = request.data.get(
                    f"{prefix}[difficulty_level]"
                )
                challenge.problem_statement = request.data.get(
                    f"{prefix}[problem_statement]"
                )
                challenge.constraints = request.data.get(f"{prefix}[constraints]")
                challenge.input_form = request.data.get(f"{prefix}[input_form]")
                challenge.output_form = request.data.get(f"{prefix}[output_form]")
                challenge.input_testcase = request.FILES.get(
                    f"{prefix}[input_testcase]"
                )
                challenge.output_testcase = request.FILES.get(
                    f"{prefix}[output_testcase]"
                )
                challenge.sample_testcase = request.data.get(
                    f"{prefix}[sample_testcase]"
                )
                challenge.sample_output = request.data.get(f"{prefix}[sample_output]")
                challenge.save()
                idx += 1
                continue
            except Http404:
                challenge = Challenges(
                    contest=contest,
                    challenge_name=name,
                    max_score=request.data.get(f"{prefix}[max_score]"),
                    difficulty_level=request.data.get(f"{prefix}[difficulty_level]"),
                    problem_statement=request.data.get(f"{prefix}[problem_statement]"),
                    constraints=request.data.get(f"{prefix}[constraints]"),
                    input_form=request.data.get(f"{prefix}[input_form]"),
                    output_form=request.data.get(f"{prefix}[output_form]"),
                    input_testcase=request.FILES.get(f"{prefix}[input_testcase]"),
                    output_testcase=request.FILES.get(f"{prefix}[output_testcase]"),
                    sample_testcase=request.data.get(f"{prefix}[sample_testcase]"),
                    sample_output=request.data.get(f"{prefix}[sample_output]"),
                )
                challenge.save()
                idx += 1

        return Response(
            {"message": "Challenges received successfully"},
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_challenges(request):
    id = request.GET.get("contestId")
    contest = get_object_or_404(Contest, id=id)
    challenges = Challenges.objects.filter(contest=contest)
    return Response(
        ChallengeSerializer(challenges, many=True).data, status=status.HTTP_200_OK
    )
    
@api_view(["POST"])
def add_challenge(request):
    
        contest_id = request.data.get("contest_id")
        contest = get_object_or_404(Contest, id=contest_id)

        challenge = Challenges(
            contest=contest,
            challenge_name=request.data.get("challenge_name"),
            max_score=request.data.get("max_score"),
            difficulty_level=request.data.get("difficulty_level"),
            problem_statement=request.data.get("problem_statement"),
            constraints=request.data.get("constraints"),
            input_form=request.data.get("input_form"),
            output_form=request.data.get("output_form"),
            input_testcase=request.FILES.get("input_testcase"),
            output_testcase=request.FILES.get("output_testcase"),
            sample_testcase=request.data.get("sample_testcase"),
            sample_output=request.data.get("sample_output"),
            isLeetCode=request.data.get("isLeetCode", False),
            cpp_code=request.data.get("cpp_code", ""),
            python_code=request.data.get("python_code", ""),
            java_code=request.data.get("java_code", ""),
        )
        challenge.save()

        return Response(
            {"message": "Challenge added successfully"}, status=status.HTTP_201_CREATED
        )



@api_view(["PUT"])
def update_challenge(request):
    if request.method == "PUT":
        challenge_id = request.data.get("challenge_id")
        challenge = get_object_or_404(Challenges, id=challenge_id)

        challenge.challenge_name = request.data.get("challenge_name")
        challenge.max_score = request.data.get("max_score")
        challenge.difficulty_level = request.data.get("difficulty_level")
        challenge.problem_statement = request.data.get("problem_statement")
        challenge.constraints = request.data.get("constraints")
        challenge.input_form = request.data.get("input_form")
        challenge.output_form = request.data.get("output_form")

        if "input_testcase" in request.FILES:
            challenge.input_testcase = request.FILES["input_testcase"]

        if "output_testcase" in request.FILES:
            challenge.output_testcase = request.FILES["output_testcase"]

        challenge.sample_testcase = request.data.get("sample_testcase")
        challenge.sample_output = request.data.get("sample_output")

        challenge.save()

        return Response(
            {"message": "Challenge updated successfully"}, status=status.HTTP_200_OK
        )

    return Response(
        {"error": "Invalid method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED
    )


@api_view(["POST"])
def delete_challenge(request):
    print("hello")
    if request.method == "POST":
        print(request.data)
        challenge_id = request.data.get("challenge_id")
        try:
            challenge = Challenges.objects.get(id=challenge_id)
            challenge.delete()
            return Response(
                {"message": "Challenge deleted successfully"}, status=status.HTTP_200_OK
            )
        except Challenges.DoesNotExist:
            return Response(
                {"error": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND
            )

    return Response(
        {"error": "Invalid method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED
    )

# @ensure_csrf_cookie
# def set_csrf_cookie(request):
#     return JsonResponse({'message': 'CSRF cookie set'})

# def Test_View(request):
#     if request.method=="POST":
#         contest=request.POST.get('contest')
#         user=request.POST.get('user')
#         contest_instance = get_object_or_404(Contest, id=contest)
#         if request.POST.get('challenge'):
#             challenge=request.POST.get('challenge')
#             challenge=get_object_or_404(Challenges,id=challenge)

#             if 'testcaseFile' in request.FILES:
#                 testcaseFile=request.FILES['testcaseFile']
#             else :
#                 testcaseFile=challenge.testcase

#             if 'outputFile' in request.FILES:
#                 outputFile=request.FILES['outputFile']
#             else :
#                 outputFile=challenge.output

#             challenge.contest=contest_instance
#             challenge.description=re.sub(r'\n+','\n',BeautifulSoup(request.POST['description'],'html.parser').get_text().strip())
#             challenge.challenge_name=request.POST['challengeName']
#             challenge.max_score=request.POST.get('Max_score')
#             challenge.difficulty_level=request.POST['difficulty']
#             challenge.problem_statement=re.sub(r'\n+','\n',BeautifulSoup(request.POST['problemStatement'],'html.parser').get_text().strip())
#             challenge.constraints=re.sub(r'\n+','\n',BeautifulSoup(request.POST['constraints'],'html.parser').get_text().strip())
#             challenge.input_form=re.sub(r'\n+','\n',BeautifulSoup(request.POST['input'],'html.parser').get_text().strip())
#             challenge.output_form=re.sub(r'\n+','\n',BeautifulSoup(request.POST['output'],'html.parser').get_text().strip())
#             challenge.testcase=testcaseFile
#             challenge.output=outputFile
#             challenge.sample_testcase=re.sub(r'\n+','\n',BeautifulSoup(request.POST['sample_testcase'],'html.parser').get_text().strip())
#             challenge.sample_output=re.sub(r'\n+','\n',BeautifulSoup(request.POST['sample_out'],'html.parser').get_text().strip())
#             challenge.save()
#         else :
#             challenge=Challenges(
#                 contest=contest_instance,
#                 description=request.POST.get('description'),
#                 challenge_name=request.POST['challengeName'],
#                 max_score=request.POST.get('Max_score'),
#                 difficulty_level=request.POST['difficulty'],
#                 problem_statement=BeautifulSoup(request.POST['problemStatement'],'html.parser').get_text(),
#                 constraints=BeautifulSoup(request.POST['constraints'],'html.parser').get_text(),
#                 input_form=BeautifulSoup(request.POST['input'],'html.parser').get_text(),
#                 output_form=BeautifulSoup(request.POST['output'],'html.parser').get_text(),
#                 testcase=request.FILES['testcaseFile'],
#                 output=request.FILES['outputFile'],
#                 sample_testcase=BeautifulSoup(request.POST['sample_testcase'],'html.parser').get_text(),
#                 sample_output=BeautifulSoup(request.POST['sample_out'],'html.parser').get_text()
#             )
#             challenge.save()
#         challenges=Challenges.objects.filter(contest=contest)
#         return redirect(f"{reverse('Test')}?contest={contest}&user={user}")
#     contest_id = request.GET.get('contest')
#     user = request.GET.get('user')
#     if not contest_id:
#         return render(request, 'contest.html', {"challenge": -1, "contest": -1})

#     contest_instance = get_object_or_404(Contest, id=contest_id)
#     challenges = Challenges.objects.filter(contest=contest_instance)
#     return render(request, 'contest.html', {"challenges": challenges, "contest": contest_id, "user": user})


def Details(request):
    if request.POST:
        contest = request.POST.get("contest")
        user = request.POST.get("user")
        print(user)
        if request.POST.get("challenge"):
            challenge = request.POST.get("challenge")
            challenge = get_object_or_404(Challenges, id=challenge)
            return render(
                request,
                "details.html",
                {"contest": contest, "user": user, "challenge": challenge},
            )
        return render(request, "details.html", {"contest": contest, "user": user})
    else:
        return render(request, "details.html", {"contets": -1})


# def Contest_View(request):
#     if request.POST:
#         source = request.POST.get('source')
#         if source=="home":
#             user=request.POST.get('user')
#             contest=Contest(
#                 user=get_object_or_404(User,id=user),
#                 contest_name=request.POST['contest-name'],
#                 start_date=request.POST['start-date'],
#                 start_time=request.POST['start-time'],
#                 end_date=request.POST['end-date'],
#                 end_time=request.POST['end-time'],
#                 number_of_entries=int(request.POST['manualInput']) if request.POST.get('maxSelect') == "manual" else  2_147_483_647
#             )
#             contest.save()
#             return render(request,'contest.html',{"contest":contest.id,"user":user})

#         if source=="main":
#             user=request.POST.get('user')
#             contest=request.POST.get('contest')
#             challenge=Challenges.objects.filter(contest=contest)
#             return render(request,'contest.html',{"contest":contest,"user":user,"challenges":challenge})


def Enter(request):
    if request.POST:
        user = request.POST.get("user")
        print(user)
        return render(request, "enter_contest.html", {"user": user})


def Home(request):
    return render(request, "home.html")


def Land(request):
    if request.POST:
        source = request.POST.get("source")
        user = request.POST.get("user")
        if source == "dashboard":
            return render(request, "land.html", {"user": user})
        else:
            contest = get_object_or_404(Contest, id=request.POST.get("contest"))
            return render(request, "land.html", {"user": user, "contest": contest})


# def delete_challenge(request):
#     if request.method == "POST":
#         challenge_id = request.POST.get("challenge_id")
#         try:
#             challenge = Challenges.objects.get(id=challenge_id)
#             challenge.delete()
#             return JsonResponse(
#                 {"success": True, "message": "Challenge deleted successfully!"}
#             )
#         except Challenges.DoesNotExist:
#             return JsonResponse(
#                 {"success": False, "message": "Challenge does not exist."}
#             )
#     return JsonResponse({"success": False, "message": "Invalid request."})


def Main(request):
    if request.POST:
        source = request.POST.get("source")
        user = request.POST.get("user")
        if source == "dashboard":
            return render(request, "main.html", {"user": user})
        elif source == "main":
            return render(request, "main.html", {"user": user})
        else:
            user = request.POST.get("user")
            contest = request.POST.get("contest")
            contest = get_object_or_404(Contest, id=contest)
            contest.user = get_object_or_404(User, id=user)
            contest.contest_name = request.POST["contest-name"]
            contest.start_date = request.POST["start-date"]
            contest.start_time = request.POST["start-time"]
            contest.end_date = request.POST["end-date"]
            contest.end_time = request.POST["end-time"]
            contest.number_of_entries = (
                int(request.POST["manualInput"])
                if request.POST.get("maxSelect") == "manual"
                else 2_147_483_647
            )
            contest.save()
            return render(request, "main.html", {"user": user})


def delete_contest(request):
    if request.method == "POST":
        data = json.loads(request.body)
        contest = get_object_or_404(Contest, id=data["id"])
        contest.delete()
        return JsonResponse({"success": True})
    return JsonResponse({"success": False})


# def update_challenge(request):
#     if request.method == "POST":
#         data = json.loads(request.body)
#         challenge_id = data.get("challenge_id")
#         challenge = get_object_or_404(Challenges, id=challenge_id)
#         challenge.challenge_name = data.get("challenge_name")
#         challenge.max_score = data.get("max_score")
#         challenge.difficulty_level = data.get("difficulty_level")
#         challenge.problem_statement = data.get("problem_statement")
#         challenge.constraints = data.get("constraints")
#         challenge.input_form = data.get("input_form")
#         challenge.output_form = data.get("output_form")
#         challenge.save()
#         return JsonResponse(
#             {"success": True, "message": "Challenge updated successfully."}
#         )

#     return JsonResponse({"success": False, "message": "Invalid request method."})


def get_challenge(request):
    challenge_id = request.GET.get("challenge_id")
    challenge = Challenges.objects.get(id=challenge_id)
    return JsonResponse(
        {
            "challenge_name": challenge.challenge_name,
            "max_score": challenge.max_score,
            "difficulty_level": challenge.difficulty_level,
            "problem_statement": challenge.problem_statement,
            "constraints": challenge.constraints,
            "input_form": challenge.input_form,
            "output_form": challenge.output_form,
        }
    )


def find_contest(request):
    if request.method == "POST":
        user = request.POST.get("user")
        user1 = get_object_or_404(User, id=user)
        contests = Contest.objects.filter(user=user1)
        contests_data = []
        for contest in contests:
            contests_data.append(
                {
                    "contest_id": contest.id,
                    "contest_name": contest.contest_name,
                    "start_date": contest.start_date,
                    "start_time": contest.start_time,
                    "end_date": contest.end_date,
                    "end_time": contest.end_time,
                }
            )
        return JsonResponse(contests_data, safe=False)


def Response1(request):
    if request.method == "POST":
        contest = request.POST.get("contest")
        scores = Score.objects.filter(contest=contest)
        score_data = []
        for score in scores:
            score_data.append(
                {
                    "Name": score.user.full_name,
                    "Email": score.user.email,
                    "Score": score.score,
                    "Time": time_format(score.time, "H:i:s"),
                }
            )
        return render(request, "response.html", {"scores": json.dumps(score_data)})


def Track(request):
    if request.method == "POST":
        user = request.POST.get("user")
        try:
            rank = get_object_or_404(Rank, user=user)
        except Http404:
            return render(
                request,
                "track.html",
                {"user": user, "rank": json.dumps([]), "score": json.dumps([])},
            )
        score = Score.objects.filter(user=user)
        rank_data = []
        score_data = []
        for r in rank.rank:
            rank_data.append({"rank": rank.rank[r]})
            contest = Contest.objects.get(id=r)
            s = score.get(contest=contest)
            score_data.append(
                {
                    "Contest": contest.contest_name,
                    "Date": contest.start_date.strftime("%Y-%m-%d"),
                    "Rank": rank.rank[r],
                    "Score": s.score,
                    "Time": time_format(s.time, "H:i:s"),
                }
            )
        return render(
            request,
            "track.html",
            {
                "user": user,
                "rank": json.dumps(rank_data),
                "score": json.dumps(score_data),
            },
        )
