import subprocess
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from Test.models import Contest, Challenges, User, Rank
from .models import Score, Testcase, Leetcode_Description, slug_map
import json
from django.http import JsonResponse
from datetime import datetime, date, timedelta, time as dt_time
import google.generativeai as genai
import requests
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
import platform
import threading

# New Code Added
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
print("API Key Configured Successfully")
model = genai.GenerativeModel("gemini-1.5-flash-latest")

slaves_servers=["https://codesphere-slave-1.onrender.com","https://codesphere-slave-2.onrender.com","https://codesphere-slave-3.onrender.com"]
slave_index=0
slave_index_lock = threading.Lock()


#Master code

@api_view(["POST"])
def get_leetcode_problem_description(request):

    if request.method == "POST":
        question_number = request.data.get("question_number")
        question_number = int(question_number)

        if Leetcode_Description.objects.filter(number=question_number).exists():
            leetcode = Leetcode_Description.objects.get(number=question_number)
            description = leetcode.description
            val = json.loads(description)
            del val["sample_testcases"]

            return Response({"question": val, "challange": description}, status=200)

        if not question_number:
            return Response({"error": "Question number is required"}, status=400)

        try:
            description, val =  get_leetcode_problem_description_Gemini(question_number)

            leetcode = Leetcode_Description(
                number=question_number,
                description=description,
            )
            leetcode.save()
            return Response({"question": val, "challange": description}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    return Response({"error": "Invalid request method"}, status=405)

def get_leetcode_slug_map():
    url = "https://leetcode.com/api/problems/all/"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    data = response.json()

    id_to_slug = {}
    for q in data["stat_status_pairs"]:
        qid = q["stat"]["frontend_question_id"]
        slug = q["stat"]["question__title_slug"]
        id_to_slug[qid] = slug
    return id_to_slug

def get_leetcode_problem_description_Gemini(question_number):
    description_html = get_leetcode_problem_data(question_number)
    prompt = f"""
    You are an expert LeetCode assistant AI designed to transform raw LeetCode problem content into two precise outputs:

    1. A fully structured JSON object strictly adhering to a predefined schema.

    You are provided with the HTML content of a LeetCode problem. Your task is to parse and extract meaningful components to build both outputs.

    ---

    ## 📦 JSON OBJECT REQUIREMENTS

    Output the following JSON fields:

    {{
    "title": "...",
    "description": "...",
    "input_format": "...",
    "output_format": "...",
    "difficulty":"...",
    "constraints": [
        "..."
    ],
    "sample_testcases": [
        {{
        "input": "...",
        "output": "...",
        "explanation": "..."
        }}
    ]
    }}

    ### Field Guidelines:

    - **title**: The exact title/name of the LeetCode problem (e.g., "Two Sum", "Add Two Numbers").
    - **description**: The full problem statement written in clear natural English (cleaned from HTML).
    - **input_format**: Describe the nature of the input using natural phrases (e.g., "An array of integers").
    - **output_format**: Describe the expected output (e.g., "An integer representing ...").
    - **difficulty**: The difficulty level of the problem (e.g., "Easy", "Medium", "Hard")
    - **constraints**: Use `10^n` format for large numbers. Do not include any formatting characters like `$` or `\\n`. Each constraint must be a separate plain-text string.
    - **sample_testcases**: Include **all** examples. Each must contain:
    - `input`: A readable, simple format (e.g., `arr1 = [1, 10, 100], arr2 = [1000]`)
    - `output`: The expected result
    - `explanation`: A plain English explanation of why the output is correct

    **The JSON must be valid, raw, and not surrounded by markdown formatting or special characters.**

    ## 🔧 INPUT PROBLEM CONTENT (HTML):

    {description_html}

    ---

    ## 🔚 OUTPUT FORMAT

    Strictly follow this order:

    **Raw JSON object (nothing extra, just valid JSON)**

    Do **not** include markdown formatting (no triple backticks), headers, summaries, or comments. The output must be raw and clean.
    """
    print("ok")

    response = model.generate_content(prompt)

    val = json.loads(response.text)

    del val["sample_testcases"]
    return response.text, val

def get_leetcode_problem_data(question_number):

    if slug_map.objects.exists() == False:
        id_slug = get_leetcode_slug_map()

        print(id_slug)

        title_slug = id_slug[question_number]

        slug = slug_map(slug=id_slug)
        slug.save()

    else:
        id_slug = slug_map.objects.first().slug
        title_slug = id_slug[str(question_number)]

    print(title_slug)

    graphql_url = "https://leetcode.com/graphql"
    query = {
        "operationName": "questionData",
        "variables": {"titleSlug": title_slug},
        "query": """
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            title
            questionId
            content
            difficulty
            exampleTestcases
          }
        }
        """,
    }

    headers = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}

    response = requests.post(graphql_url, json=query, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(f"Request failed with status {response.status_code}")

    json_response = response.json()
    if "data" not in json_response or not json_response["data"].get("question"):
        raise ValueError(
            f"Could not fetch data for slug: {title_slug}. Response: {json_response}"
        )

    question_data = json_response["data"]["question"]

    return question_data["content"]


@api_view(["POST"])
def leaderboard(request):
    contest_id = request.data.get("contest")
    contest = get_object_or_404(Contest, id=contest_id)
    score = Score.objects.filter(contest=contest)
    dict1 = {}
    dict2={}
    for score_obj in score:
        dict1[score_obj.user.id] = dict1.get(score_obj.user.id, 0) + score_obj.score
        t=score_obj.time
        seconds = t.hour * 3600 + t.minute * 60 + t.second
        dict2[score_obj.user.id] = dict2.get(score_obj.user.id, 0) + seconds
    dict1 = sorted(
        dict1.items(),
        key=lambda x: (-x[1], dict2.get(x[0], 0))
    )

    data=[]
    for rank ,(user_id, score) in enumerate(dict1) :
        data.append({
            "Rank": rank + 1,
            "Name": User.objects.get(id=user_id).full_name, 
            "Solved": len(Score.objects.get(user=User.objects.get(id=user_id), contest=contest).solved),
            "Total_problem": len(Challenges.objects.filter(contest=contest)),
            "Time_taken": str(timedelta(seconds=dict2[user_id])),
            "Avatar": User.objects.get(id=user_id).profile_photo,
            "score": score
        })
        user = User.objects.get(id=user_id)
        rank_obj, created = Rank.objects.get_or_create(user=user)
        rank_data = rank_obj.rank or {}
        rank_data[str(contest_id)] = rank + 1
        rank_obj.rank = rank_data
        rank_obj.save()        
        print("Ranked Added")
    return Response({"finalRankings": data})
    
    
@api_view(["POST"])
def get_user_progress(request):
    if request.method == "POST":
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "User ID is required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
            scores = Score.objects.filter(user=user)
            rank=Rank.objects.get(user=user)
            
            if not scores:
                return Response({"error": "No scores found for this user"}, status=200)

            stats = []
            contestHistory = []
            
            total_score = 0
            print(rank.rank)
            total_rank = 0
            total_score = 0
            best_rank = 0  
            problemSolved = 0
            for (score,rank_) in zip(scores,rank.rank.values()):
                print('Hello')
                total_score += score.score
                best_rank = max(best_rank,rank_)
                problemSolved += len(score.solved)              
                total_rank+=rank_
                contestHistory.append({
                    "id":score.contest.id,
                    "name": score.challenge.challenge_name,
                    "date": score.contest.start_date.strftime("%Y-%m-%d"),
                    "rank": rank_,
                    "score": score.score,
                    "problem": Challenges.objects.filter(contest=score.contest.id).count(),
                    "solved": sum(score.solved.values()) if isinstance(score.solved, dict) else score.solved,
                    "time": str(score.time),
                    "participants": Contest.objects.get(id=score.contest.id).number_of_participants
                })  
            
            stats.append({
                "totalContests": scores.count(),
                "averageRank": total_rank / len(rank.rank.values()),
                "totalScore": total_score,
                "bestRank": best_rank,
                "problemsSolved": problemSolved,
            })
            
            data = {
                "contestHistory": contestHistory,
                "stats": stats,
            }

            return Response(data, status=200)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Contest.DoesNotExist:
            return Response({"error": "Contest not found"}, status=404)


#Slaves Code
def get_next_slave():
    global slave_index
    with slave_index_lock:
        slave_url = slaves_servers[slave_index]
        slave_index = (slave_index + 1) % len(slaves_servers)
    return slave_url

@api_view(["POST"])
def submit_code_master(request):
    global slave_index

    slave_url = get_next_slave()

    try:
        slave_response = requests.post(f"{slave_url}/submitCode", json=request.data, timeout=60)
        return Response(slave_response.json(), status=slave_response.status_code)
    except requests.RequestException as e:
        return Response({"error": "Slave server unreachable", "details": str(e)}, status=500)

@api_view(["POST"])
def run_code_master(request):
    global slave_index

    slave_url = get_next_slave()

    try:
        slave_response = requests.post(f"{slave_url}/runCode", json=request.data, timeout=60)
        return Response(slave_response.json(), status=slave_response.status_code)
    except requests.RequestException as e:
        return Response({"error": "Slave server unreachable", "details": str(e)}, status=500)

@api_view(["POST"])
def get_test_cases_master(request):
    global slave_index

    slave_url = get_next_slave()

    try:
        slave_response = requests.post(f"{slave_url}/getTestCases", json=request.data, timeout=60)
        return Response(slave_response.json(), status=slave_response.status_code)
    except requests.RequestException as e:
        return Response({"error": "Slave server unreachable", "details": str(e)}, status=500)



# def get_CPP_code(val, list1):

# prompt3 = f"""
# You are an expert C++ programmer and a master of algorithm design. Your task is to write a complete, single-file C++ solution for the problem described below. Your code must be robust, generalized, and should not be hardcoded for specific examples.

# ** Problem Description : **
# {val}

# ### 2. Input Format Specification

# Your C++ code's `main()` function must parse input delivered as a single stream of **space-separated values**. You should use standard input streams (e.g., `std::cin`) to read the data.

# **Input Structure:**
# The input will be provided in the following specific order, with each item separated by one or more spaces:
# 1.  An integer `m` (the number of rows in the grid).
# 2.  An integer `n` (the number of columns in the grid).
# 3.  `m * n` characters, representing the grid's content, provided in row-major order.
# 4.  The string `word` to be searched for in the grid.

# **Example Input:**
# For a grid `[['A','B','C'],['S','F','S']]` and the word `SEE`, the corresponding space-separated input stream would be:
# `2 3 A B C S F S SEE`

# **Guiding Principle for Deduction:**
# -When you analyze the sample test cases, you should look for a general, underlying pattern. As a universal hint for the problems you'll receive, this pattern is:
# -Multi-Element Collections (e.g., vectors, arrays): Are always preceded in the input stream by their dimension(s) as integers. A 1D collection will be preceded by its size; a 2D collection by its rows and columns.
# -Single Values (e.g., int, std::string): Are given directly in the input stream without any preceding size integer.
# -Your generated code must be a direct implementation of the format you deduce by applying this principle to the problem description and the provided test cases.


# Your parsing logic must be robust enough to handle any valid input that follows this structure, not just the example provided. The sample test cases in the next section will also adhere to this space-separated format.

# **Sample Test Cases (for logic validation):**
# {list1}

# ### 3. Code Generation Requirements

# * Generate a complete C++ solution in a single code block.
# * The solution must include a `main()` function.
# * The `main()` function must contain all necessary code to read the input according to the **space-separated format** specified above.
# * Implement the full logic required to solve the problem efficiently using a backtracking algorithm.
# * Adhere to modern C++ best practices (e.g., use `<vector>`, `<string>`, `<iostream>`).
# * `#include <cstddef>` ← *Add this to safely use `size_t` and related types.*
# * Do not add any explanatory text or comments outside of the code block in your final output.
# """
# response2 = model.generate_content(prompt3)
# return response2.text


# @api_view(["POST"])
# def generate_test_cases(request):
#     if request.method == "POST":
#         description = request.data.get("description")
#         print(f"Received description: {type(description)}")
#         question_number = request.data.get("question_number")
#         if not description:
#             return Response({"error": "Description is required"}, status=400)

#         if Testcase.objects.filter(question_number=question_number).exists():
#             test = Testcase.objects.get(question_number=question_number)
#             return Response({
#                 "message": "Test cases already generated",
#                 "test_cases": test.test_cases.split("\n")[0:10],
#                 "output_cases": test.output_cases.split("\n"),
#             }, status=200)

#         try:
#             file_name = "code.py"
#             code = get_python_code(description)

#             code = code.replace("```python", "")
#             code = code.replace("```", "")
#             code = code.strip()

#             print(f"Generated code: {code}")

#             with open(file_name, "w") as file:
#                 file.write(code)
#                 file.flush()

#             execute_command = "python code.py"
#             execute_process = subprocess.Popen(
#                 execute_command,
#                 shell=True,
#                 stdin=subprocess.PIPE,
#                 stdout=subprocess.PIPE,
#                 stderr=subprocess.PIPE,
#                 text=True,
#             )
#             execute_stdout, execute_stderr = execute_process.communicate()

#             if execute_process.returncode != 0:
#                 return Response(
#                     {"error": "Error in code execution", "details": execute_stderr},
#                     status=500,
#                 )

#             test_cases = execute_stdout.strip().split("\n")
#             test_cases_file = "test_cases.txt"

#             with open(test_cases_file, "w") as file:
#                 for case in test_cases:
#                     file.write(case + "\n")
#                     file.flush()

#             list1 = test_cases[0:5]
#             print(f"Generated list: {list1}")
#             print(f"Parsed problem description: {description}")

#             val = description.copy() if isinstance(description, dict) else description

#             if isinstance(val, dict) and "sample_testcases" in val:
#                 del val["sample_testcases"]
#                 print("sample_testcases removed")
#             else:
#                 print("sample_testcases not found in description")

#             get_cpp_code = get_CPP_code(val, list1)

#             get_cpp_code = get_cpp_code.replace("```cpp", "")
#             get_cpp_code = get_cpp_code.replace("```c++", "")
#             get_cpp_code = get_cpp_code.replace("```", "")
#             get_cpp_code = get_cpp_code.strip()

#             print(f"Generated C++ code: {get_cpp_code}")

#             cpp_result = cpp_create_output_file(get_cpp_code, test_cases_file)

#             if not cpp_result:
#                 print("⚠️ Local C++ compilation failed, trying alternative approach...")
#                 return Response({
#                     "message": "Test cases generated successfully",
#                     "test_cases": list1,
#                     "warning": "C++ compilation skipped - no compiler available"
#                 }, status=200)


#             with open("output.txt", "r") as f:
#                 output_lines = [line.strip() for line in f.readlines()]

#             test=Testcase(
#                 question_number=question_number,
#                 input="\n".join(test_cases),
#                 output="\n".join(output_lines),
#                 code_template=get_cpp_code,
#             )
#             test.save()

#             return Response({"message": "Test cases generated successfully", "test_cases": test_cases[0:10], "output_cases": output_lines}, status=200)

#         except Exception as e:
#             print(f"Exception in generate_test_cases: {str(e)}")
#             return Response({"error": str(e)}, status=500)


# def cpp_create_output_file(code_template, challenge_file_path):
#     exe_file = "code.exe" if platform.system() == "Windows" else "code"
#     cpp_file = "code.cpp"
#     output_file = "output.txt"

#     print("🔧 Starting code compilation and execution process...\n")

#     if platform.system() == "Windows":
#         common_paths = [
#             "C:\\msys64\\mingw64\\bin",
#             "C:\\mingw64\\bin",
#             "C:\\MinGW\\bin",
#             "C:\\Program Files\\mingw-w64\\x86_64-8.1.0-posix-seh-rt_v6-rev0\\mingw64\\bin"
#         ]

#         current_path = os.environ.get('PATH', '')
#         for path in common_paths:
#             if os.path.exists(path) and path not in current_path:
#                 os.environ['PATH'] = path + os.pathsep + current_path
#                 print(f"✅ Added {path} to PATH")
#                 break


#     try:
#         with open(cpp_file, "w") as file:
#             file.write(code_template)
#         print(f"📄 Successfully wrote code to {cpp_file}")
#     except Exception as e:
#         print(f"❌ Failed to write code to file: {e}")
#         return False

#     # Step 2: Check for available C++ compilers and compile
#     compilers = []
#     if platform.system() == "Windows":
#         # Try different compiler options for Windows, including full paths
#         compilers = [
#             "g++",  # MinGW
#             "C:\\msys64\\mingw64\\bin\\g++.exe",  # Common MSYS2 path
#             "C:\\mingw64\\bin\\g++.exe",  # Alternative MinGW path
#             # Add your specific path here - run 'where g++' in cmd to find it
#             "clang++",  # Clang
#             "cl",  # Visual Studio
#         ]
#     else:
#         compilers = ["g++", "clang++"]

#     compiled = False
#     for compiler in compilers:
#         try:
#             if compiler == "cl":
#                 # Visual Studio compiler syntax
#                 command = f"{compiler} {cpp_file} /Fe:{exe_file}"
#             else:
#                 # GCC/Clang syntax
#                 command = f"{compiler} {cpp_file} -o {exe_file}"

#             print(f"⚙️ Trying to compile with: {command}")

#             compile_process = subprocess.Popen(
#                 command,
#                 shell=True,
#                 stdout=subprocess.PIPE,
#                 stderr=subprocess.PIPE,
#                 text=True
#             )
#             compile_stdout, compile_stderr = compile_process.communicate()

#             if compile_process.returncode == 0:
#                 print(f"✅ Compilation successful with {compiler}\n")
#                 compiled = True
#                 break
#             else:
#                 print(f"❌ {compiler} failed: {compile_stderr}")

#         except Exception as e:
#             print(f"❌ Exception with {compiler}: {e}")
#             continue

#     if not compiled:
#         print("❌ No C++ compiler found. Please install one of the following:")
#         print("   - MinGW-w64 (includes g++)")
#         print("   - Visual Studio Build Tools")
#         print("   - Clang/LLVM")
#         print("   - Or use online compiler alternative")
#         return False


#     if not os.path.exists(exe_file):
#         print(f"❌ Executable {exe_file} was not created")
#         return False

#     # Step 3: Run test cases
#     try:

#         if not os.path.exists(challenge_file_path):
#             print(f"❌ Challenge file not found: {challenge_file_path}")
#             return False

#         with open(challenge_file_path, "r") as test_file, open(output_file, "w") as out_file:
#             print(f"📂 Reading test cases from: {challenge_file_path}")


#             test_lines = test_file.readlines()
#             if not test_lines:
#                 print("❌ No test cases found in file")
#                 return False

#             first_line ="19"
#             try:
#                 num_tests = int(first_line)
#                 print(f"✅ Number of test cases: {num_tests}\n")
#             except ValueError:
#                 print(f"❌ Invalid number of test cases: {first_line}")
#                 return False


#             if len(test_lines) < num_tests + 1:
#                 print(f"❌ Not enough test cases in file. Expected {num_tests}, found {len(test_lines)-1}")
#                 return False

#             for i in range(num_tests):
#                 if i + 1 < len(test_lines):
#                     test_input = test_lines[i + 1].strip()
#                     print(f"▶️ Running test case {i+1}: {test_input}")

#                     try:
#                         run_command = f"{exe_file}" if platform.system() == "Windows" else f"./{exe_file}"
#                         process = subprocess.Popen(
#                             run_command,
#                             shell=True,
#                             stdin=subprocess.PIPE,
#                             stdout=subprocess.PIPE,
#                             stderr=subprocess.PIPE,
#                             text=True,
#                         )
#                         out, err = process.communicate(input=test_input + "\n", timeout=10)  # FIX 9: Add timeout

#                         if process.returncode != 0:
#                             print(f"❌ Runtime error in test case {i+1}: {err.strip()}")
#                             out_file.write("ERROR\n")
#                         else:
#                             print(f"✅ Output: {out.strip()}")
#                             out_file.write(out.strip() + "\n")
#                     except subprocess.TimeoutExpired:
#                         print(f"❌ Test case {i+1} timed out")
#                         process.kill()
#                         out_file.write("TIMEOUT\n")
#                     except Exception as e:
#                         print(f"❌ Exception while running test case {i+1}: {e}")
#                         out_file.write("EXCEPTION\n")

#     except FileNotFoundError:
#         print(f"❌ Challenge file not found: {challenge_file_path}")
#         return False
#     except Exception as e:
#         print(f"❌ Error during test execution: {e}")
#         return False

#     print(f"\n📄 Outputs saved in: {output_file}")
#     return True


# def cleanup_files():
#     """Clean up temporary files"""
#     files_to_remove = ["code.py", "code.cpp", "code.exe", "code", "test_cases.txt", "output.txt"]
#     for file_name in files_to_remove:
#         try:
#             if os.path.exists(file_name):
#                 os.remove(file_name)
#                 print(f"🗑️ Removed {file_name}")
#         except Exception as e:
#             print(f"❌ Failed to remove {file_name}: {e}")


# OLD Code
def test(request):

    if request.POST:
        challenge_id = request.POST.get("value_id")
        user = request.POST.get("user")
        challenge = get_object_or_404(Challenges, id=challenge_id)
        return render(
            request,
            "test.html",
            {
                "name": challenge.challenge_name,
                "challenge": challenge_id,
                "problem_statement": challenge.problem_statement,
                "constraints": challenge.constraints,
                "input": challenge.input_form,
                "output": challenge.output_form,
                "sample": challenge.sample_testcase,
                "sample_out": challenge.sample_output,
                "user": user,
            },
        )


def submit(request):
    if request.method == "POST":
        contest_id = request.POST.get("contest_id")
        user = request.POST.get("user")
        if (
            request.POST.get("value") == "Already Submitted"
            or request.POST.get("value") == "Contest Ended"
        ):
            return render(
                request,
                "result.html",
                {"user": user, "contest_id": contest_id, "success": True},
            )
        seconds = int(request.POST.get("time"))
        score = Score.objects.get(user=user, contest=contest_id)
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        score.time = dt_time(hour=hours, minute=minutes, second=secs)
        score.save()
        return render(
            request,
            "result.html",
            {"user": user, "contest_id": contest_id, "success": True},
        )


def compile1(request):
    if request.method == "POST":
        data1 = json.loads(request.body)
        code_template = data1.get("code")
        challenge_id = data1.get("challenge_id")
        user = data1.get("user")
        challenge = get_object_or_404(Challenges, id=challenge_id)
        if data1.get("action") == "run":
            if data1.get("language") == "java":
                return java(code_template, challenge, 0, 0, user)

            else:
                return python(code_template, challenge, 0, 0, user)

        if data1.get("action") == "submit":
            if data1.get("language") == "java":
                return java(code_template, challenge, 1, 0, user)

            else:
                return python(code_template, challenge, 1, 0, user)


def start(request):
    if request.POST:
        contest_id = request.POST.get("contest")
        user_id = request.POST.get("user")
        time = datetime.now().strftime("%H:%M:%S")
        return render(
            request,
            "start.html",
            {"contest_id": contest_id, "user": user_id, "time": time},
        )
    return render(request, "start.html")


def get(request):
    if request.POST:
        contest_id = request.POST.get("contest_id")
        contest = get_object_or_404(Contest, id=contest_id)
        user = request.POST.get("user")
        user = get_object_or_404(User, id=user)
        challenges = Challenges.objects.filter(contest=contest)
        list1 = []
        for challenge in challenges:
            list1.append(
                {
                    "challenge_id": challenge.id,
                    "challenge_name": challenge.challenge_name,
                    "max_score": challenge.max_score,
                    "difficulty_level": challenge.difficulty_level.capitalize(),
                    "description": challenge.description,
                }
            )
            if Score.objects.filter(user=user, challenge=challenge).exists():
                continue
            else:
                score = Score(contest=contest, user=user, challenge=challenge, score=0)
            score.save()
        return JsonResponse({"head": contest.contest_name, "list": list1}, safe=False)


def java(code_template, challenge, val, score, user):

    file_name = "Solution.java"
    with open("Solution.java", "w") as file:
        file.write(code_template)
        file.flush()

    command = "javac Solution.java"
    compile_process = subprocess.Popen(
        command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    compile_stdout, compile_stderr = compile_process.communicate()
    if compile_process.returncode != 0:
        return JsonResponse({"Error": compile_stderr.decode(), "success": False})

    if val == 0:
        sample = challenge.sample_testcase.split("\n")
        sample_output = challenge.sample_output.split("\n")

        for test, output in zip(sample, sample_output):
            execute_command = "java Solution"
            execute_process = subprocess.Popen(
                execute_command,
                shell=True,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                print(test)
                execute_stdout, execute_stderr = execute_process.communicate(
                    input=test.strip(), timeout=5
                )
            except subprocess.TimeoutExpired:
                return JsonResponse({"Error": "Time Limit Exceeded", "success": False})
            print(execute_stdout)
            if execute_process.returncode != 0:
                return JsonResponse({"Error": execute_stderr, "success": False})

            if execute_stdout.strip() == output:
                continue
            else:
                return JsonResponse(
                    {
                        "Error": f"Your Outcome : {execute_stdout.strip()}\nExpected Outcome : {output}",
                        "success": False,
                    }
                )
        return JsonResponse(
            {"msg": "Congrats you passed all sample testcase ", "success": True}
        )

    else:
        with open(challenge.testcase.path, "r") as test, open(
            challenge.output.path, "r"
        ) as out:
            num_tests = int(test.readline())
            for i in range(num_tests):
                test_case = test.readline().strip()
                output = out.readline().strip()

                execute_command = "java Solution"
                execute_process = subprocess.Popen(
                    execute_command,
                    shell=True,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                try:
                    print(test_case)
                    execute_stdout, execute_stderr = execute_process.communicate(
                        input=test_case, timeout=5
                    )
                    print(execute_stdout)
                except subprocess.TimeoutExpired:
                    execute_process.kill()
                    user = get_object_or_404(User, id=user)
                    score_obj = Score.objects.filter(user=user).get(challenge=challenge)
                    score_obj.score = max(score_obj.score, score)
                    score_obj.save()
                    return JsonResponse(
                        {"Error": "Time Limit Exceeded", "success": False}
                    )
                if execute_process.returncode != 0:
                    user = get_object_or_404(User, id=user)
                    score_obj = Score.objects.filter(user=user).get(challenge=challenge)
                    score_obj.score = max(score_obj.score, score)
                    score_obj.save()
                    return JsonResponse({"Error": execute_stderr, "success": False})

                if execute_stdout.strip() == output:
                    score += challenge.max_score
                    continue
                else:
                    user = get_object_or_404(User, id=user)
                    score_obj = Score.objects.filter(user=user).get(challenge=challenge)
                    score_obj.score = max(score_obj.score, score)
                    score_obj.save()
                    return JsonResponse(
                        {
                            "Error": f"Your Outcome : {execute_stdout.strip()}\nExpected Outcome : {output}",
                            "success": False,
                        }
                    )
            user = get_object_or_404(User, id=user)
            score_obj = Score.objects.filter(user=user).get(challenge=challenge)
            score_obj.score = max(score_obj.score, score)
            score_obj.save()
        return JsonResponse(
            {"msg": "Congrats you passed all testcase ", "success": True}
        )


def python(code_template, challenge, val, score, user):

    file_name = "code.py"
    with open("code.py", "w") as file:
        file.write(code_template)
        file.flush()

    if val == 0:
        sample = challenge.sample_testcase.split("\n")
        sample_output = challenge.sample_output.split("\n")

        for test, output in zip(sample, sample_output):
            execute_command = "python code.py"
            execute_process = subprocess.Popen(
                execute_command,
                shell=True,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                execute_stdout, execute_stderr = execute_process.communicate(
                    input=test.strip(), timeout=5
                )
            except subprocess.TimeoutExpired:
                return JsonResponse({"Error": "Time Limit Exceeded", "success": False})
            if execute_process.returncode != 0:
                return JsonResponse({"Error": execute_stderr, "success": False})

            if execute_stdout.strip() == output:
                continue
            else:
                return JsonResponse(
                    {
                        "Error": f"Your Outcome : {execute_stdout.strip()}\nExpected Outcome : {output}",
                        "success": False,
                    }
                )
        return JsonResponse(
            {"msg": "Congrats you passed all sample testcase ", "success": True}
        )

    else:
        with open(challenge.testcase.path, "r") as test, open(
            challenge.output.path, "r"
        ) as out:
            num_tests = int(test.readline())
            for i in range(num_tests):
                test_case = test.readline().strip()
                output = out.readline().strip()

                execute_command = "python code.py"
                execute_process = subprocess.Popen(
                    execute_command,
                    shell=True,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                try:
                    execute_stdout, execute_stderr = execute_process.communicate(
                        input=test_case.strip(), timeout=5
                    )
                except subprocess.TimeoutExpired:
                    execute_process.kill()
                    user = get_object_or_404(User, id=user)
                    score_obj = Score.objects.filter(user=user).get(challenge=challenge)
                    score_obj.score = max(score_obj.score, score)
                    score_obj.save()
                    return JsonResponse(
                        {"Error": "Time Limit Exceeded", "success": False}
                    )
                if execute_process.returncode != 0:
                    user = get_object_or_404(User, id=user)
                    score_obj = Score.objects.filter(user=user).get(challenge=challenge)
                    score_obj.score = max(score_obj.score, score)
                    score_obj.save()
                    return JsonResponse({"Error": execute_stderr, "success": False})

                if execute_stdout.strip() == output:
                    score += challenge.max_score
                    continue
                else:
                    user = get_object_or_404(User, id=user)
                    score_obj = Score.objects.filter(user=user).get(challenge=challenge)
                    score_obj.score = max(score_obj.score, score)
                    score_obj.save()
                    return JsonResponse(
                        {
                            "Error": f"Your Outcome : {execute_stdout.strip()}\n Expected Outcome : {output}",
                            "success": False,
                        }
                    )
            user = get_object_or_404(User, id=user)
            score_obj = Score.objects.filter(user=user).get(challenge=challenge)
            score_obj.score = max(score_obj.score, score)
            score_obj.save()
        return JsonResponse(
            {"msg": "Congrats you passed all testcase ", "success": True}
        )


def time(request):
    contest = request.POST.get("contest")
    contest = get_object_or_404(Contest, id=contest)
    return JsonResponse(
        {
            "startDate": contest.start_date,
            "startTime": contest.start_time,
            "endDate": contest.end_date,
            "endTime": contest.end_time,
        }
    )


def result(request):
    user = request.POST.get("user")
    contest_id = request.POST.get("contest_id")
    c = Contest.objects.get(id=contest_id)
    start_dt = datetime.combine(date.today(), c.end_time)
    now = datetime.now()
    diff = int((now - start_dt).total_seconds())
    rank = Score.objects.filter(contest=contest_id).order_by("-score", "time")
    rank_data = []
    for i, score_obj in enumerate(rank):
        rank_data.append(
            {
                "Rank": i + 1,
                "Name": score_obj.user.full_name,
                "Email": score_obj.user.email,
                "Score": score_obj.score,
                "Time": str(score_obj.time),
            }
        )
        if diff > 5:
            rank1, created = Rank.objects.get_or_create(user=score_obj.user)
            if rank1.rank is None:
                rank1.rank = []
            rank1.rank[contest_id] = i + 1
            rank1.save()
    if diff > 5:
        return JsonResponse({"ranks": rank_data, "success": False})
    return JsonResponse({"ranks": rank_data, "success": True})


def cpp(code_template, challenge, val):
    print(code_template)
    exe_file = "code.exe" if platform.system() == "Windows" else "code"

    with open("code.cpp", "w") as file:
        file.write(code_template)

    command = f"g++ code.cpp -o {exe_file}"
    compile_process = subprocess.Popen(
        command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    compile_stdout, compile_stderr = compile_process.communicate()

    if compile_process.returncode != 0:
        return JsonResponse({"Error": compile_stderr.decode(), "success": False})

    print("Compilation successful")

    execute_command = f"./{exe_file}"

    if val == 0:
        sample = challenge.sample_testcase.strip().split("\n")
        sample_output = challenge.sample_output.strip().split("\n")

        for test, output in zip(sample, sample_output):
            process = subprocess.Popen(
                execute_command,
                shell=True,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            out, err = process.communicate(input=test)
            if process.returncode != 0:
                return JsonResponse({"Error": err, "success": False})
            if out.strip() != output.strip():
                return JsonResponse(
                    {
                        "Your Outcome": out.strip(),
                        "Expected Outcome": output.strip(),
                        "success": False,
                    }
                )
        return JsonResponse(
            {"msg": "Congrats you passed all sample testcase", "success": True}
        )

    else:
        file_name = "output.txt"
        with open(challenge, "r") as test_file, open(file_name, "w") as out_file:
            num_tests = int(test_file.readline())
            for _ in range(num_tests):
                test_input = test_file.readline().strip()
                print("Test input:", test_input)

                process = subprocess.Popen(
                    execute_command,
                    shell=True,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                out, err = process.communicate(input=test_input)

                if process.returncode != 0:
                    return JsonResponse({"Error": err, "success": False})

                out_file.write(out.strip() + "\n")
                out_file.flush()

        return JsonResponse({"msg": "Output generated successfully", "success": True})
