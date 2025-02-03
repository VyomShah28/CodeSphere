from django.shortcuts import render
from .models import Challenges,Contest,User
from django.shortcuts import get_object_or_404
import json
from bs4 import BeautifulSoup
from django.http import JsonResponse
from django.contrib.auth.hashers import check_password,make_password
import re
# Create your views here.
def Test_View(request):
    if request.POST:
        contest=request.POST.get('contest')
        user=request.POST.get('user')
        print(user)
        contest_instance = get_object_or_404(Contest, id=contest)
        if request.POST.get('challenge'):
            challenge=request.POST.get('challenge')
            challenge=get_object_or_404(Challenges,id=challenge)

            if 'testcaseFile' in request.FILES:
                testcaseFile=request.FILES['testcaseFile']
            else :
                testcaseFile=challenge.testcase
            
            if 'outputFile' in request.FILES:
                outputFile=request.FILES['outputFile']
            else :
                outputFile=challenge.output

            challenge.contest=contest_instance
            challenge.description=re.sub(r'\n+','\n',BeautifulSoup(request.POST['description'],'html.parser').get_text().strip())
            challenge.challenge_name=request.POST['challengeName']
            challenge.max_score=request.POST.get('Max_score')
            challenge.difficulty_level=request.POST['difficulty']
            challenge.problem_statement=re.sub(r'\n+','\n',BeautifulSoup(request.POST['problemStatement'],'html.parser').get_text().strip())
            challenge.constraints=re.sub(r'\n+','\n',BeautifulSoup(request.POST['constraints'],'html.parser').get_text().strip())
            challenge.input_form=re.sub(r'\n+','\n',BeautifulSoup(request.POST['input'],'html.parser').get_text().strip())
            challenge.output_form=re.sub(r'\n+','\n',BeautifulSoup(request.POST['output'],'html.parser').get_text().strip())
            challenge.testcase=testcaseFile
            challenge.output=outputFile
            challenge.sample_testcase=re.sub(r'\n+','\n',BeautifulSoup(request.POST['sample_testcase'],'html.parser').get_text().strip())
            challenge.sample_output=re.sub(r'\n+','\n',BeautifulSoup(request.POST['sample_out'],'html.parser').get_text().strip())
            challenge.save()
        else : 
            challenge=Challenges(
                contest=contest_instance,
                description=request.POST.get('description'),
                challenge_name=request.POST['challengeName'],
                max_score=request.POST.get('Max_score'),
                difficulty_level=request.POST['difficulty'],
                problem_statement=BeautifulSoup(request.POST['problemStatement'],'html.parser').get_text(),
                constraints=BeautifulSoup(request.POST['constraints'],'html.parser').get_text(),
                input_form=BeautifulSoup(request.POST['input'],'html.parser').get_text(),
                output_form=BeautifulSoup(request.POST['output'],'html.parser').get_text(),
                testcase=request.FILES['testcaseFile'],
                output=request.FILES['outputFile'],
                sample_testcase=BeautifulSoup(request.POST['sample_testcase'],'html.parser').get_text(),
                sample_output=BeautifulSoup(request.POST['sample_out'],'html.parser').get_text()
            )
            challenge.save()
        challenges=Challenges.objects.filter(contest=contest)
        return render(request,'contest.html',{"challenges":challenges,"contest":contest,"user":user})
    return render(request,'contest.html',{"challenge":-1,"contest":-1})

def Details(request):
    if request.POST:
        contest=request.POST.get('contest')
        user=request.POST.get('user')
        print(user)
        if request.POST.get('challenge'):
            challenge=request.POST.get('challenge')
            challenge=get_object_or_404(Challenges,id=challenge)
            return render(request,'details.html',{'contest':contest,'user':user,'challenge':challenge})
        return render(request,'details.html',{"contest":contest,"user":user})
    else : 
        return render(request,'details.html',{'contets':-1})

def Contest_View(request):
    if request.POST:
        source = request.POST.get('source')
        if source=="home":
            user=request.POST.get('user')
            contest=Contest(
                user=get_object_or_404(User,id=user),
                contest_name=request.POST['contest-name'],
                start_date=request.POST['start-date'],
                start_time=request.POST['start-time'],
                end_date=request.POST['end-date'],
                end_time=request.POST['end-time'],
                number_of_entries=int(request.POST['manualInput']) if request.POST.get('maxSelect') == "manual" else  2_147_483_647
            )
            contest.save()
            return render(request,'contest.html',{"contest":contest.id,"user":user})
        
        if source=="main":
            user=request.POST.get('user')
            contest=request.POST.get('contest')
            challenge=Challenges.objects.filter(contest=contest)
            return render(request,'contest.html',{"contest":contest,"user":user,"challenges":challenge})

def Enter(request):
    if request.POST:
        user=request.POST.get('user')
        print(user)
        return render(request,'enter_contest.html',{"user":user})

def Home(request):
    return render(request,'home.html')

def Land(request):
    if request.POST : 
        source=request.POST.get('source')
        user=request.POST.get('user')
        if source=='sidebar':
            return render(request,'land.html',{"user":user})
        else : 
            contest=get_object_or_404(Contest,id=request.POST.get('contest'))
            return render(request,'land.html',{"user":user,"contest":contest})

def delete_challenge(request):
    if request.method == "POST":
        challenge_id = request.POST.get('challenge_id')
        try:
            challenge = Challenges.objects.get(id=challenge_id)
            challenge.delete()
            return JsonResponse({'success': True, 'message': 'Challenge deleted successfully!'})
        except Challenges.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Challenge does not exist.'})
    return JsonResponse({'success': False, 'message': 'Invalid request.'})

def Main(request):
    if request.POST:
        source=request.POST.get('source')
        user=request.POST.get('user')
        if source=="sidebar" :
            return render(request,'main.html',{"user":user})
        elif source=='main':
            return render(request,'main.html',{'user':user})
        else : 
            user=request.POST.get('user')
            contest=request.POST.get('contest')
            contest=get_object_or_404(Contest,id=contest)
            contest.user=get_object_or_404(User,id=user)
            contest.contest_name=request.POST['contest-name']
            contest.start_date=request.POST['start-date']
            contest.start_time=request.POST['start-time']
            contest.end_date=request.POST['end-date']
            contest.end_time=request.POST['end-time']
            contest.number_of_entries=int(request.POST['manualInput']) if request.POST.get('maxSelect') == "manual" else  2_147_483_647
            contest.save()
            return render(request,'main.html',{'user':user})

        
def Login(request):
    return render(request,'login.html')

def Signup(request):
    return render(request,'signup.html')
    
def sidebar(request):
    if request.POST:
        source=request.POST.get('source')
        if source=="signup" :
            if json.loads(Check(request).content.decode('utf-8'))["flag"]==False:
                user=User(
                    full_name=request.POST['name'],
                    email=request.POST['email'],
                    password=make_password(request.POST['password'])
                )
                user.save()
                return render(request,'sidebar.html',{"user":user.id})
            else : 
                email=request.POST.get('email')
                user=User.objects.get(email=email)
                return render(request,'sidebar.html',{"user":user.id})
        else : 
            user=request.POST.get('user')
            return render(request,'sidebar.html',{"user":user})
        
def delete_contest(request):
    if request.method=="POST":
        data=json.loads(request.body)
        contest=get_object_or_404(Contest,id=data['id'])
        contest.delete()
        return JsonResponse({"success":True})
    return JsonResponse({"success":False})

def check_email(request):
    if request.method=="POST":
        email=request.POST['email']
        try :
            user=User.objects.get(email=email)
            return JsonResponse({"success":True})
        except User.DoesNotExist:
            return JsonResponse({"success":False})

def Check(request) : 
    if request.method == "POST":
            email = request.POST['email']
            password = request.POST['password']
            try:
                user = User.objects.get(email=email)
                if check_password(password, user.password): 
                    return JsonResponse({"msg": "Success", "flag": True, "user": user.id})
                else:
                    return JsonResponse({"msg": "Password Or Email is Wrong", "flag": False})
            except User.DoesNotExist:
                return JsonResponse({"msg": "User Does Not Exist", "flag": False})

def update_challenge(request):
    if request.method=="POST":
        data=json.loads(request.body)
        challenge_id=data.get('challenge_id')
        challenge=get_object_or_404(Challenges,id=challenge_id)
        challenge.challenge_name = data.get('challenge_name')
        challenge.max_score = data.get('max_score')
        challenge.difficulty_level = data.get('difficulty_level')
        challenge.problem_statement = data.get('problem_statement')
        challenge.constraints = data.get('constraints')
        challenge.input_form = data.get('input_form')
        challenge.output_form = data.get('output_form')
        challenge.save()
        return JsonResponse({'success': True, 'message': 'Challenge updated successfully.'})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})
        
def get_challenge(request):
    challenge_id = request.GET.get('challenge_id')
    challenge = Challenges.objects.get(id=challenge_id)
    return JsonResponse({
        'challenge_name': challenge.challenge_name,
        'max_score': challenge.max_score,
        'difficulty_level': challenge.difficulty_level,
        'problem_statement': challenge.problem_statement,
        'constraints': challenge.constraints,
        'input_form': challenge.input_form,
        'output_form': challenge.output_form,
    })        

def find_contest(request):
    if request.method=="POST":
        user=request.POST.get('user')
        user1=get_object_or_404(User,id=user)
        contests = Contest.objects.filter(user=user1)
        contests_data = []
        for contest in contests:
            contests_data.append({
                'contest_id':contest.id,
                'contest_name': contest.contest_name,
                'start_date': contest.start_date, 
                'start_time': contest.start_time,
                'end_date': contest.end_date,
                'end_time': contest.end_time
            })
        return JsonResponse(contests_data, safe=False)
