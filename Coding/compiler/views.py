import subprocess
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from Test.models import Contest,Challenges,User
from .models import Score
import json
from django.http import JsonResponse

def test(request):

    if request.POST:
        challenge_id=request.POST.get('value_id')
        user=request.POST.get('user')
        challenge=get_object_or_404(Challenges,id=challenge_id)
        return render(request,'test.html',{
            "name":challenge.challenge_name,
            "challenge":challenge_id,
            "problem_statement":challenge.problem_statement,
            "constraints":challenge.constraints,
            "input":challenge.input_form,
            "output":challenge.output_form,
            "sample":challenge.sample_testcase,
            "sample_out":challenge.sample_output,
            "user":user
        })
    
def compile1(request):
    if request.method=="POST":
        data1 = json.loads(request.body)
        code_template=data1.get('code')
        challenge_id=data1.get('challenge_id')
        user=data1.get('user')
        challenge=get_object_or_404(Challenges,id=challenge_id)
        if data1.get('action')=="run":
            if data1.get('language')=="java":
                return java(code_template,challenge,0,0,user)

            else : 
                return python(code_template,challenge,0,0,user)

        if data1.get('action')=="submit":
            if data1.get('language')=="java":
                return java(code_template,challenge,1,0,user)

            else : 
                return python(code_template,challenge,1,0,user)

def start(request):
    if request.POST : 
        contest_id=request.POST.get('contest')
        user_id=request.POST.get('user')
        return render(request,'start.html',{"contest_id":contest_id,"user":user_id})
    return render(request,'start.html')


def get(request):
    if request.POST:
        contest_id=request.POST.get('contest_id')
        contest=get_object_or_404(Contest,id=contest_id)
        user=request.POST.get('user')
        user=get_object_or_404(User,id=user)
        challenges=Challenges.objects.filter(contest=contest)
        list1=[]
        for challenge in challenges:
            list1.append({"challenge_id":challenge.id,
                          "challenge_name":challenge.challenge_name,
                          "max_score":challenge.max_score,
                          "difficulty_level":challenge.difficulty_level.capitalize(),
                          "description":challenge.description
                        })
            if Score.objects.filter(user=user,challenge=challenge).exists():
                continue
            else : 
                score=Score(
                    contest=contest,
                    user=user,
                    challenge=challenge,
                    score=0
                )
            score.save()
        return JsonResponse({"head":contest.contest_name,"list":list1},safe=False)


def java(code_template,challenge,val,score,user):

    file_name="Solution.java"
    with open("Solution.java","w") as file:
        file.write(code_template)
        file.flush()

    command='javac Solution.java'
    compile_process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    compile_stdout, compile_stderr = compile_process.communicate()
    if compile_process.returncode != 0:
        return JsonResponse({"Error":compile_stderr.decode(),"success":False})
        
    if val==0 : 
        sample=challenge.sample_testcase.split('\n')
        sample_output=challenge.sample_output.split('\n')

        for test,output in zip(sample,sample_output):
            execute_command ='java Solution'
            execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)
            try : 
                print(test)
                execute_stdout, execute_stderr = execute_process.communicate(input=test.strip(),timeout=5)
            except subprocess.TimeoutExpired:
                return JsonResponse({"Error" : "Time Limit Exceeded","success":False})
            print(execute_stdout)
            if execute_process.returncode != 0:
                return JsonResponse({"Error":execute_stderr,"success":False})
                    
            if execute_stdout.strip()==output:
                continue
            else :
                return JsonResponse({"Error":f"Your Outcome : {execute_stdout.strip()}\nExpected Outcome : {output}","success":False})
        return JsonResponse({"msg" : "Congrats you passed all sample testcase ","success":True})
            

    else :         
        with open(challenge.testcase.path,'r') as test,\
                open (challenge.output.path,'r') as out:
                num_tests = int(test.readline())
                for i in range(num_tests):
                    test_case=test.readline().strip()
                    output=out.readline().strip()

                    execute_command ='java Solution'
                    execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)
                    try : 
                        print(test_case)
                        execute_stdout, execute_stderr = execute_process.communicate(input=test_case,timeout=5)
                        print(execute_stdout)
                    except subprocess.TimeoutExpired:
                        execute_process.kill()
                        user=get_object_or_404(User,id=user)
                        score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                        score_obj.score=max(score_obj.score,score)
                        score_obj.save()
                        return JsonResponse({"Error" : "Time Limit Exceeded","success":False})
                    if execute_process.returncode != 0:
                        user=get_object_or_404(User,id=user)
                        score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                        score_obj.score=max(score_obj.score,score)
                        score_obj.save()
                        return JsonResponse({"Error":execute_stderr,"success":False})
                    
                    if execute_stdout.strip()==output:
                        score+=challenge.max_score
                        continue
                    else :
                        user=get_object_or_404(User,id=user)
                        score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                        score_obj.score=max(score_obj.score,score)
                        score_obj.save()
                        return JsonResponse({"Error":f"Your Outcome : {execute_stdout.strip()}\nExpected Outcome : {output}","success":False})
                user=get_object_or_404(User,id=user)
                score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                score_obj.score=max(score_obj.score,score)
                score_obj.save()
        return JsonResponse({"msg" : "Congrats you passed all testcase ","success":True})

def python(code_template,challenge,val,score,user):  

    file_name="code.py"
    with open("code.py","w") as file:
        file.write(code_template)
        file.flush()

    if val==0 : 
        sample=challenge.sample_testcase.split('\n')
        sample_output=challenge.sample_output.split('\n')

        for test,output in zip(sample,sample_output):
            execute_command ='python code.py'
            execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)
            try : 
                execute_stdout, execute_stderr = execute_process.communicate(input=test.strip(),timeout=5)
            except subprocess.TimeoutExpired:
                return JsonResponse({"Error" : "Time Limit Exceeded","success":False})
            if execute_process.returncode != 0:
                return JsonResponse({"Error":execute_stderr,"success":False})
                    
            if execute_stdout.strip()==output:
                continue
            else :
                return JsonResponse({"Error":f"Your Outcome : {execute_stdout.strip()}\nExpected Outcome : {output}","success":False})
        return JsonResponse({"msg" : "Congrats you passed all sample testcase ","success":True})

    else : 
        with open(challenge.testcase.path,'r') as test,\
            open (challenge.output.path,'r') as out:
                num_tests = int(test.readline())
                for i in range(num_tests):
                    test_case=test.readline().strip()
                    output=out.readline().strip()

                    execute_command ='python code.py'
                    execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)
                    try : 
                        execute_stdout, execute_stderr = execute_process.communicate(input=test_case.strip(),timeout=5)
                    except subprocess.TimeoutExpired:
                        execute_process.kill()
                        user=get_object_or_404(User,id=user)
                        score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                        score_obj.score=max(score_obj.score,score)
                        score_obj.save()
                        return JsonResponse({"Error" : "Time Limit Exceeded","success":False})
                    if execute_process.returncode != 0:
                        user=get_object_or_404(User,id=user)
                        score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                        score_obj.score=max(score_obj.score,score)
                        score_obj.save()
                        return JsonResponse({"Error":execute_stderr,"success":False})
                        
                    if execute_stdout.strip()==output:
                        score+=challenge.max_score
                        continue
                    else :
                        user=get_object_or_404(User,id=user)
                        score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                        score_obj.score=max(score_obj.score,score)
                        score_obj.save()
                        return JsonResponse({"Error":f"Your Outcome : {execute_stdout.strip()}\n Expected Outcome : {output}","success":False})
                user=get_object_or_404(User,id=user)
                score_obj=Score.objects.filter(user=user).get(challenge=challenge)
                score_obj.score=max(score_obj.score,score)
                score_obj.save()
        return JsonResponse({"msg" : "Congrats you passed all testcase ","success":True})

def leaderboard(request):
    if request.POST : 
        contest_id=request.POST.get('contest')
        contest=get_object_or_404(Contest,id=contest_id)
        score=Score.objects.filter(contest=contest)
        dict1={}
        for score_obj in score :    
            dict1[score_obj.user.id]=dict1.get(score_obj.user.id,0)+score_obj.score
        dict1=sorted(dict1.items(),key=lambda x : x[1] ,reverse=True)
        data=[{'user':User.objects.get(id=user_id).full_name,'score':score}
              for user_id,score in dict1 ]
        return JsonResponse({'Leaderboard':data})


def time(request):
    contest=request.POST.get('contest')
    contest=get_object_or_404(Contest,id=contest)
    return JsonResponse({'startDate':contest.start_date,'startTime':contest.start_time,'endDate':contest.end_date,'endTime':contest.end_time})

# def cpp(code_template,challenge,val):
#     file_name="code.cpp"
#     with open("code.cpp","w") as file:
#         file.write(code_template)
#         command = 'g++ code.cpp -o code.exe -m32 -mconsole'
#         compile_process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#         compile_stdout, compile_stderr = compile_process.communicate()
#         if compile_process.returncode != 0:
#             return JsonResponse({"Error":compile_stderr.decode(),"success":False})    
#     if val==0 : 
#         sample=challenge.sample_testcase.split('\n')
#         sample_output=challenge.sample_output.split('\n')

#         for test,output in zip(sample,sample_output):
#             execute_command ='./code'
#             execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)
#             execute_stdout, execute_stderr = execute_process.communicate(input=test)
#             if execute_process.returncode != 0:
#                 return JsonResponse({"Error":execute_stderr,"success":False})
                    
#             if execute_stdout.strip()==output:
#                 continue
#             else :
#                 return JsonResponse({"Your Outcome" : execute_stdout.strip(),"Expected Outcome" : output,"success":False})
#         return JsonResponse({"msg" : "Congrats you passed all sample testcase ","success":True})
        
#     else :     
#         with open(challenge.testcase.path,'r') as test,\
#             open (challenge.output.path,'r') as out:
#                 num_tests = int(test.readline())
#                 for i in range(num_tests):
#                     test_case=test.readline().strip()
#                     output=out.readline().strip()

#                     print(test_case)

#                     execute_command ='./code'
#                     execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)
#                     execute_stdout, execute_stderr = execute_process.communicate(input=test_case)
#                     if execute_process.returncode != 0:
#                         return JsonResponse({"Error":execute_stderr,"success":False})
                        
#                     if execute_stdout.strip()==output:
#                         continue
#                     else :
#                         return JsonResponse({"Your Outcome" : execute_stdout.strip(),"Expected Outcome" : output,"success":False})
#         return JsonResponse({"msg" : "Congrats you passed all testcase ","success":True})      
