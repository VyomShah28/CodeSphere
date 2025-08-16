from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import subprocess
import tempfile
import platform
from datetime import datetime, timedelta, time as dt_time
from .models import Contest, User, Challenges, Score, Leetcode_Description, Testcase
import re
import google.generativeai as genai
import time as time_mod
import json
from django.db import transaction
from groq import Groq

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
print("API Key Configured Successfully")
model = genai.GenerativeModel("gemini-1.5-flash-latest")

CODE_EXECUTION_TIMEOUT = 5

@api_view(["POST"])
def submit_code(request):
    code = request.data.get("code")
    language = request.data.get("language", "").lower()
    input_data = request.data.get("inputs", "")
    total_mark = int(request.data.get("total_mark", 0)) / 15
    contest = Contest.objects.get(id=request.data.get("contestId"))
    user = User.objects.get(id=request.data.get("userId"))
    challenge = Challenges.objects.get(id=request.data.get("challengeId", ""))
    time = request.data.get("timeLeft", {})
    print(f"Received time data: {time}")
    hour = int(time["hours"])
    minute = int(time["minutes"])
    second = int(time["seconds"])

    my_time = dt_time(hour, minute, second)

    start_time = datetime.combine(contest.start_date, contest.start_time)
    end_time = datetime.combine(contest.end_date, contest.end_time)

    diff = end_time - start_time - time_to_delta(my_time)
    print(f"Input data: {input_data}")
    expected_output = request.data.get("outputs", "")
    print(f"Expected output: {expected_output}")

    if not code or not language:
        return Response(
            {"success": False, "error": "Code and language are required"}, status=400
        )

    if language == "python":
        solution = submit_python_code(
            code, input_data, expected_output, total_mark, contest, user, challenge
        )
        print(f"Solution: {solution}")
        with transaction.atomic():
            score_obj = Score.objects.select_for_update().get(contest=contest, user=user, challenge=challenge)
            print(f"Score object: {score_obj}")
            total_seconds = int(diff.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            score_obj.time = dt_time(hours, minutes, seconds)
            score_obj.save()
        return Response(solution, status=200)

    if language == "java":
        print(diff)
        solution = submit_java_code(
            code, input_data, expected_output, total_mark, contest, user, challenge
        )
        with transaction.atomic():
            score_obj = Score.objects.select_for_update().get(contest=contest, user=user, challenge=challenge)
            total_seconds = int(diff.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            score_obj.time = dt_time(hours, minutes, seconds)
            score_obj.save()
        return Response(solution, status=200)

    with tempfile.TemporaryDirectory() as temp_dir:

        cpp_path = os.path.join(temp_dir, "source.cpp")
        executable_name = "program.exe" if platform.system() == "Windows" else "program"
        executable_path = os.path.join(temp_dir, executable_name)

        with open(cpp_path, "w") as source_file:
            source_file.write(code)

        compilers_to_try, env = get_compilers()
        compilation_successful = False
        compile_stderr_details = ""

        for compiler in compilers_to_try:
            compile_command = [compiler, "-std=c++17", cpp_path, "-o", executable_path]

            try:
                compile_process = subprocess.Popen(
                    compile_command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    env=env,
                )
                _, compile_stderr = compile_process.communicate()

                if compile_process.returncode == 0:
                    print(f"[*] Compilation successful with '{compiler}'.")
                    compilation_successful = True
                    break
                else:
                    compile_stderr_details += f"--- {compiler} ---\n{compile_stderr or 'No error message produced.'}\n"

            except FileNotFoundError:
                compile_stderr_details += (
                    f"--- {compiler} ---\nCompiler not found in system PATH.\n"
                )
                continue

        if not compilation_successful:
            print("[ERROR] All compilation attempts failed.")
            return Response(
                {
                    "success": False,
                    "error": "Compilation Failed",
                    "details": compile_stderr_details,
                },
                status=400,
            )

        try:
            run_command = [executable_path]
            testcase = input_data.split("\n")
            
            with transaction.atomic():
                score_obj, created = Score.objects.select_for_update().get_or_create(
                    contest=contest,
                    user=user,
                    challenge=challenge,
                    defaults={"score": 0, "solved": {}} 
                )

                max_score = score_obj.score
                solve = score_obj.solved if score_obj.solved is not None else {}
                
                score = 0
                for test, out in zip(testcase, expected_output.split("\n")):
                    try:
                        execute_process = subprocess.Popen(
                            run_command,
                            stdin=subprocess.PIPE,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            text=True,
                        )
                        actual_output, runtime_stderr = execute_process.communicate(
                            input=test, timeout=CODE_EXECUTION_TIMEOUT
                        )

                        if execute_process.returncode != 0:
                            
                            score_obj.score = max(max_score, score)
                            score_obj.time = diff
                            score_obj.save()
                            return Response(
                                {
                                    "success": False,
                                    "error": "Runtime Error",
                                    "details": runtime_stderr,
                                },
                                status=400,
                            )
                    except subprocess.TimeoutExpired:
                        execute_process.kill()
                        
                        score_obj.score = max(max_score, score)
                        score_obj.time = diff
                        score_obj.save()
                        return Response(
                            {"success": False, "error": "Time Limit Exceeded"}, status=400
                        )

                    if actual_output.strip() != out.strip():
                        
                        score_obj.score = max(max_score, score)
                        score_obj.time = diff
                        score_obj.save()
                        return Response(
                            {
                                "success": True,
                                "result": {
                                    "status": "failed",
                                    "actual_output": actual_output.strip(),
                                    "expected_output": expected_output.strip(),
                                    "execution_time": "0.1ms",
                                    "memory_used": "N/A",
                                },
                            },
                            status=200,
                        )

                    score += total_mark
                    print("Passed", test)
                
                
                score_obj.score = max(max_score, score)
                solve[challenge.id] = 1 
                score_obj.solved = solve 
                score_obj.time = diff 
                score_obj.save() 

            return Response(
                {
                    "success": True,
                    "result": {
                        "status": "passed",
                        "execution_time": "0.1ms",
                        "memory_used": "N/A",
                    },
                },
                status=200,
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Server execution error.",
                    "details": str(e),
                },
                status=500,
            )

def time_to_delta(t):
    return timedelta(hours=t.hour, minutes=t.minute, seconds=t.second)

def submit_python_code(code, input_data, expected_output, total_mark, contest, user, challenge):
    with tempfile.TemporaryDirectory() as temp_dir:
        py_path = os.path.join(temp_dir, "source.py")
        with open(py_path, "w") as source_file:
            source_file.write(code)

        start_time = time_mod.time()

        with transaction.atomic():
            score_obj, created = Score.objects.select_for_update().get_or_create(
                contest=contest, user=user, challenge=challenge,
                defaults={"score": 0, "solved": {}}
            )

            max_score = score_obj.score
            solve = score_obj.solved if score_obj.solved is not None else {}

            score = 0
            testcases_passed = 0
            total_testcases = len(input_data.strip().split("\n"))
            inputs = input_data.strip().split("\n")
            outputs = expected_output.strip().split("\n")

            for test, out in zip(inputs, outputs):
                try:
                    execute_process = subprocess.Popen(
                        ["python", py_path],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                    actual_output, runtime_stderr = execute_process.communicate(
                        input=test, timeout=CODE_EXECUTION_TIMEOUT
                    )

                    if execute_process.returncode != 0:
                        score_obj.score = max(max_score, score)
                        score_obj.save()
                        return {
                            "success": False,
                            "error": f"Runtime Error:\n{runtime_stderr.strip()}",
                        }

                    if actual_output.strip() == out.strip():
                        score += total_mark
                        testcases_passed += 1
                    else:
                        end_time = time_mod.time()
                        execution_time = round(end_time - start_time, 4)
                        
                        score_obj.score = max(max_score, score)
                        score_obj.save()
                        return {
                            "success": True,
                            "result": {
                                "status": "rejected",
                                "score": score,
                                "maxScore": total_mark * total_testcases,
                                "testcasesPassed": testcases_passed,
                                "totalTestcases": total_testcases,
                                "executionTime": f"{execution_time}s",
                                "memoryUsed": "N/A",
                            },
                        }
                except subprocess.TimeoutExpired:
                    execute_process.kill()
                    end_time = time_mod.time()
                    execution_time = round(end_time - start_time, 4)
                    
                    score_obj.score = max(max_score, score)
                    score_obj.save()
                    return {
                        "success": False,
                        "error": "Time Limit Exceeded",
                        "result": {
                            "status": "rejected",
                            "score": score,
                            "maxScore": total_mark * total_testcases,
                            "testcasesPassed": testcases_passed,
                            "totalTestcases": total_testcases,
                            "executionTime": f"{execution_time}s",
                            "memoryUsed": "N/A",
                        },
                    }
                except FileNotFoundError:
                    return {
                        "success": False,
                        "error": "Python interpreter not found. Please ensure 'python' is in the system's PATH.",
                    }

            end_time = time_mod.time()
            execution_time = round(end_time - start_time, 4)
            solve[challenge.id] = 1
            score_obj.solved = solve
            score_obj.score = max(max_score, score)
            score_obj.save()

            return {
                "success": True,
                "result": {
                    "status": "accepted",
                    "score": score,
                    "maxScore": total_mark * total_testcases,
                    "testcasesPassed": testcases_passed,
                    "totalTestcases": total_testcases,
                    "executionTime": f"{execution_time}s",
                    "memoryUsed": "N/A",
                },
            }

def submit_java_code(
    code, input_data, expected_output, total_mark, contest, user, challenge
):
    match = re.search(r"public\s+class\s+(\w+)", code)
    if not match:
        return {
            "success": False,
            "error": "Compilation Failed: Could not find a 'public class' declaration in the code.",
        }
    main_class_name = match.group(1)

    with tempfile.TemporaryDirectory() as temp_dir:
        java_path = os.path.join(temp_dir, f"{main_class_name}.java")
        with open(java_path, "w") as source_file:
            source_file.write(code)

        try:
            compile_process = subprocess.Popen(
                ["javac", java_path],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            _, compile_stderr = compile_process.communicate(
                timeout=CODE_EXECUTION_TIMEOUT
            )
            if compile_process.returncode != 0:
                return {
                    "success": False,
                    "error": f"Compilation Failed:\n{compile_stderr.strip()}",
                }
        except FileNotFoundError:
            return {
                "success": False,
                "error": "JDK not found. Please ensure 'javac' is in the system's PATH.",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Compilation Timed Out"}

        start_time = time_mod.time()

        # The core logic for score calculation and database update is now atomic
        with transaction.atomic():
            # Get or create the Score object, locking it for update
            score_obj, created = Score.objects.select_for_update().get_or_create(
                contest=contest, user=user, challenge=challenge,
                defaults={"score": 0, "solved": {}}
            )

            # Get the current state from the locked object
            max_score = score_obj.score
            solve = score_obj.solved if score_obj.solved is not None else {}
            score = 0

            for test, out in zip(input_data.split("\n"), expected_output.split("\n")):
                try:
                    execute_process = subprocess.Popen(
                        ["java", main_class_name],
                        cwd=temp_dir,
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                    actual_output, runtime_stderr = execute_process.communicate(
                        input=test, timeout=CODE_EXECUTION_TIMEOUT
                    )
                    end_time = time_mod.time()
                    execution_time = round(end_time - start_time, 4)

                    if execute_process.returncode != 0:
                        # Update and save before returning
                        score_obj.score = max(max_score, score)
                        score_obj.save()
                        return {
                            "success": False,
                            "error": f"Runtime Error:\n{runtime_stderr.strip()}",
                        }
                except subprocess.TimeoutExpired:
                    print("Failed Time")
                    # Update and save before returning
                    score_obj.score = max(max_score, score)
                    score_obj.save()
                    execute_process.kill()
                    return {"success": False, "error": "Time Limit Exceeded"}
                except FileNotFoundError:
                    print("Failed JRE")
                    return {
                        "success": False,
                        "error": "JRE not found. Please ensure 'java' is in the system's PATH.",
                    }

                if actual_output.strip() != out.strip():
                    print(test)
                    print(
                        f"Failed Output : {actual_output.strip()}, Actual Output : {out.strip()}"
                    )
                    # Update and save before returning
                    score_obj.score = max(max_score, score)
                    score_obj.save()
                    return {
                        "success": True,
                        "result": {
                            "status": "failed",
                            "actual_output": actual_output.strip(),
                            "expected_output": expected_output.strip(),
                            "execution_time": execution_time,
                            "memory_used": "N/A",
                        },
                    }
                score += total_mark
                print("Passed")
                print(test)
            
            # Final update if all tests passed
            score_obj.score = max(max_score, score)
            solve[challenge.id] = 1
            score_obj.solved = solve
            score_obj.save()

            return {
                "success": True,
                "result": {
                    "status": "passed",
                    "execution_time": execution_time,
                    "memory_used": "N/A",
                },
            }

def get_compilers():
    """Returns a list of potential C++ compilers to try and a suitable environment."""
    if platform.system() == "Windows":
        return get_windows_compilers_env()
    else:
        return ["g++", "clang++"], os.environ.copy()

def get_windows_compilers_env():

    common_paths = [
        "C:\\msys64\\mingw64\\bin",
        "C:\\mingw-w64\\x86_64-8.1.0-posix-seh-rt_v6-rev0\\mingw64\\bin",
        "C:\\Program Files\\mingw-w64\\x86_64-8.1.0-posix-seh-rt_v6-rev0\\mingw64\\bin",
        "C:\\MinGW\\bin",
    ]

    env = os.environ.copy()

    for path in common_paths:

        if os.path.exists(os.path.join(path, "g++.exe")):
            print(f"[*] Found potential g++ compiler in: {path}")

            env["PATH"] = path + os.pathsep + env["PATH"]
            return ["g++", "clang++"], env

    return ["g++", "clang++"], env


@api_view(["POST"])
def run_code(request):

    code = request.data.get("code")
    language = request.data.get("language", "").lower()
    input_data = request.data.get("input", "")
    expected_output = request.data.get("expected_output", "")

    if not code or not language:
        return Response(
            {"success": False, "error": "Code and language are required"}, status=400
        )

    if language == "python":
        return Response(run_python_code(code, input_data, expected_output), status=200)

    if language == "java":
        return Response(run_java_code(code, input_data, expected_output), status=200)

    with tempfile.TemporaryDirectory() as temp_dir:

        cpp_path = os.path.join(temp_dir, "source.cpp")
        executable_name = "program.exe" if platform.system() == "Windows" else "program"
        executable_path = os.path.join(temp_dir, executable_name)

        with open(cpp_path, "w") as source_file:
            source_file.write(code)

        compilers_to_try, env = get_compilers()
        compilation_successful = False
        compile_stderr_details = ""

        for compiler in compilers_to_try:
            compile_command = [compiler, "-std=c++17", cpp_path, "-o", executable_path]

            try:
                compile_process = subprocess.Popen(
                    compile_command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    env=env,
                )
                _, compile_stderr = compile_process.communicate()

                if compile_process.returncode == 0:
                    print(f"[*] Compilation successful with '{compiler}'.")
                    compilation_successful = True
                    break
                else:
                    compile_stderr_details += f"--- {compiler} ---\n{compile_stderr or 'No error message produced.'}\n"

            except FileNotFoundError:
                compile_stderr_details += (
                    f"--- {compiler} ---\nCompiler not found in system PATH.\n"
                )
                continue

        if not compilation_successful:
            print("[ERROR] All compilation attempts failed.")
            return Response(
                {
                    "success": False,
                    "error": "Compilation Failed",
                    "details": compile_stderr_details,
                },
                status=400,
            )

        try:
            run_command = [executable_path]
            execute_process = subprocess.Popen(
                run_command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            actual_output, runtime_stderr = execute_process.communicate(
                input=input_data, timeout=CODE_EXECUTION_TIMEOUT
            )

            if execute_process.returncode != 0:
                return Response(
                    {
                        "success": False,
                        "error": "Runtime Error",
                        "details": runtime_stderr,
                    },
                    status=400,
                )

        except subprocess.TimeoutExpired:
            execute_process.kill()
            return Response(
                {"success": False, "error": "Time Limit Exceeded"}, status=400
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Server execution error.",
                    "details": str(e),
                },
                status=500,
            )

        if actual_output.strip() == expected_output.strip():
            print("[*] SUCCESS: Output matches expected.")
            return Response(
                {
                    "success": True,
                    "result": {
                        "status": "passed",
                        "output": actual_output.strip(),
                        "execution_time": "0.1ms",
                        "memory_used": "N/A",
                    },
                },
                status=200,
            )
        else:
            return Response(
                {
                    "success": True,
                    "result": {
                        "status": "failed",
                        "actual_output": actual_output.strip(),
                        "expected_output": expected_output.strip(),
                        "execution_time": "0.1ms",
                        "memory_used": "N/A",
                    },
                },
                status=200,
            )

def run_python_code(code, input_data, expected_output):
    with tempfile.TemporaryDirectory() as temp_dir:
        py_path = os.path.join(temp_dir, "source.py")
        with open(py_path, "w") as source_file:
            source_file.write(code)

        try:
            start_time = time_mod.time()
            execute_process = subprocess.Popen(
                ["python", py_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            actual_output, runtime_stderr = execute_process.communicate(
                input=input_data, timeout=CODE_EXECUTION_TIMEOUT
            )
            end_time = time_mod.time()
            execution_time = round(end_time - start_time, 4)

            if execute_process.returncode != 0:
                return {
                    "success": False,
                    "error": f"Runtime Error:\n{runtime_stderr.strip()}",
                }

        except subprocess.TimeoutExpired:
            execute_process.kill()
            return {"success": False, "error": "Time Limit Exceeded"}
        except FileNotFoundError:
            return {
                "success": False,
                "error": "Python interpreter not found. Please ensure 'python' is in the system's PATH.",
            }

        if actual_output.strip() == expected_output.strip():
            return {
                "success": True,
                "result": {
                    "status": "passed",
                    "output": actual_output.strip(),
                    "execution_time": execution_time,
                    "memory_used": "N/A",
                },
            }
        else:
            return {
                "success": True,
                "result": {
                    "status": "failed",
                    "actual_output": actual_output.strip(),
                    "expected_output": expected_output.strip(),
                    "execution_time": execution_time,
                    "memory_used": "N/A",
                },
            }

def run_java_code(code, input_data, expected_output):
    match = re.search(r"public\s+class\s+(\w+)", code)
    if not match:
        return {
            "success": False,
            "error": "Compilation Failed: Could not find a 'public class' declaration in the code.",
        }

    main_class_name = match.group(1)

    with tempfile.TemporaryDirectory() as temp_dir:
        java_path = os.path.join(temp_dir, f"{main_class_name}.java")
        with open(java_path, "w") as source_file:
            source_file.write(code)

        try:
            compile_process = subprocess.Popen(
                ["javac", java_path],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            _, compile_stderr = compile_process.communicate(
                timeout=CODE_EXECUTION_TIMEOUT
            )
            if compile_process.returncode != 0:
                return {
                    "success": False,
                    "error": f"Compilation Failed:\n{compile_stderr.strip()}",
                }
        except FileNotFoundError:
            return {
                "success": False,
                "error": "JDK not found. Please ensure 'javac' is in the system's PATH.",
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Compilation Timed Out"}

        try:
            start_time = time_mod.time()
            execute_process = subprocess.Popen(
                ["java", main_class_name],
                cwd=temp_dir,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            actual_output, runtime_stderr = execute_process.communicate(
                input=input_data, timeout=CODE_EXECUTION_TIMEOUT
            )
            end_time = time_mod.time()
            execution_time = round(end_time - start_time, 4)

            if execute_process.returncode != 0:
                return {
                    "success": False,
                    "error": f"Runtime Error:\n{runtime_stderr.strip()}",
                }

        except subprocess.TimeoutExpired:
            execute_process.kill()
            return {"success": False, "error": "Time Limit Exceeded"}
        except FileNotFoundError:
            return {
                "success": False,
                "error": "JRE not found. Please ensure 'java' is in the system's PATH.",
            }

        if actual_output.strip() == expected_output.strip():
            return {
                "success": True,
                "result": {
                    "status": "passed",
                    "output": actual_output.strip(),
                    "execution_time": execution_time,
                    "memory_used": "N/A",
                },
            }
        else:
            return {
                "success": True,
                "result": {
                    "status": "failed",
                    "actual_output": actual_output.strip(),
                    "expected_output": expected_output.strip(),
                    "execution_time": execution_time,
                    "memory_used": "N/A",
                },
            }


def get_python_code(description):
    response = None
    prompt3 = f"""
    You are an expert in creating test cases for competitive programming problems. Your task is to generate exactly 15 test cases based on the problem description provided, including all sample test cases from the problem specification.

        # PRIMARY OBJECTIVE
        - Generate 15 formatted test case inputs, incorporating all sample test cases from the PROBLEM SPECIFICATION SECTION and generating additional test cases to reach a total of 15.

        # OUTPUT STRUCTURE
        You MUST provide your response in the following exact JSON format. Do NOT include any explanations, Python code, or other text — only the JSON data.

        ## JSON Format:
        - A JSON object with a single key: "input".
        - The "input" field's value MUST be a single string containing 15 lines, with each line separated by one and only one newline character (`\\n`). **The use of double newlines (`\\n\\n`) or any blank lines is strictly forbidden.**
        - The first \\(S\\) lines must be the sample test cases from the PROBLEM SPECIFICATION SECTION, reformatted to match the formatting rules below.
        - The remaining \\(15 - S\\) lines are generated test cases.
        - All input formatting rules below must be strictly followed.

        Example structure:
        ```json
        {{
        "input": "line1_input\\nline2_input\\n...\\nline15_input"
        }}
        ```
        
        ## Test Case Inputs
        - Exactly 15 lines of input data.
        - Each line is a complete, single-line, space-separated test case.
        - The first \\(S\\) lines must be the sample test cases from the PROBLEM SPECIFICATION SECTION, reformatted to match the formatting rules below.
        - The remaining \\(15 - S\\) lines are generated test cases.
        - All input formatting rules below must be strictly followed.

        # TEST CASE GENERATION RULES (15 Cases Total)

        - **Incorporate Sample Test Cases**: Extract all sample inputs from the `sample_testcases` section of the PROBLEM SPECIFICATION SECTION. Convert each sample input to a single-line, space-separated format, adding size prefixes for collections as per the formatting rules below. Include these as the first \\(S\\) lines.
        - **Generate Additional Cases**: Generate \\(15 - S\\) additional test cases to reach a total of 15. These must be diverse, including basic, moderate, and edge cases. The values within a test case should be interrelated to test specific scenarios (e.g., sorted data, all identical values, etc.). *Do not simply use random, unrelated values.*

        ## Constraint Adherence:
        - **CRITICAL SIZE RESTRICTION**: For generated test cases (not samples), any dimension (e.g., array size N, matrix rows M) must NOT exceed 30% of its maximum allowed constraint.
        Example: If a problem constraint is `1 <= N <= 1000`, generated `N` for the additional test cases must be in the range `1 <= N <= 300`.
        - **Value Range**: All element values (for both sample and generated test cases) must be within their full specified constraint ranges.
        - **Sample Test Cases**: Sample test cases may use any valid sizes within the problem constraints, as they are provided by the problem description, but must be formatted correctly.

        # MANDATORY INPUT FORMATTING (SIZE PREFIXING)

        For ANY collection of data (arrays, lists, matrices, etc.) in your inputs (including sample test cases), you MUST prefix it with its dimensional size information.

        **CRITICAL: ELEMENT COUNT MUST EXACTLY MATCH THE DECLARED SIZE PREFIX.**

        If you declare size `N`, you MUST generate EXACTLY `N` elements.
        If you declare dimensions `M x N`, you MUST generate EXACTLY `M * N` elements.
        **NO EXCEPTIONS.**

        ## Dimension-based Size Prefixing Rules:
        - **1D Collections**: {{{{size}}}} {{{{elements...}}}}
        - **2D Collections**: {{{{rows}}}} {{{{cols}}}} {{{{elements...}}}} (flattened row-by-row)
        - **nD Collections**: {{{{dim1}}}} {{{{dim2}}}} ... {{{{dimN}}}} {{{{elements...}}}} (flattened)

        ---

        **CRITICAL RULE**: Element Count MUST Match Size Prefix.
        This is the most important formatting rule.

        ### Examples:
        - *1D Array*:
        If size is `4`, the input must be: `4 e1 e2 e3 e4`
        ❌ Incorrect: `4 e1 e2 e3`
        ❌ Incorrect: `4 e1 e2 e3 e4 e5`

        - *2D Matrix*:
        If rows = `2` and cols = `3`, input must be: `2 3 e11 e12 e13 e21 e22 e23`
        The number of elements = `2 * 3 = 6`.

        Failure to follow this rule invalidates the entire test case.

        **Note**: Single values (like an integer or string) are *not* collections and must NOT be prefixed.

        ### CRITICAL RULE FOR STRINGS
        - When a parameter is a string, you MUST output its value directly.
        - DO NOT enclose the string value in double quotes (`"`).
        - ✅ Correct: `hello_world`
        - ❌ Incorrect: `"hello_world"`
        - This rule is absolute and applies to all string parameters in all test cases.

        ### Collection Examples:
        - Array `[5, 3, 8]`: `3 5 3 8`
        - Integer `42`: `42`
        - Matrix `[[1, 2], [3, 4]]`: `2 2 1 2 3 4`
        - String `"hello"`: `hello`

        ---

        # INPUT ORDER PRESERVATION

        The order of input parameters in each test case (both sample and generated) MUST exactly match the order specified in the `sample_testcases` section of the problem.

        - Add the required size prefix **only** for collections (arrays, matrices, etc.).
        - Maintain the *exact* order of input parameters (collections and non-collections) as they appear.

        ---

        ---
        ###THIS IS THE SINGLE MOST IMPORTANT RULE. FAILURE TO FOLLOW IT PERFECTLY MAKES THE ENTIRE OUTPUT USELESS.###

            -Before generating any data, you MUST first analyze the sample_testcases to determine the exact sequence and type of all parameters on a single input line. This sequence is the "Input Template".
            -Example Analysis:
            -If a sample input is an integer N, an array of N elements, and a final integer K:
            -The identified Input Template is: (Integer, Array, Integer).
            -A valid line MUST look like: 5 1 2 3 4 5 99. (5 is N, 1 2 3 4 5 is the array, 99 is K).
            -A line like 5 1 2 3 4 5 is an ABJECT FAILURE because the final integer K is missing.
            -If a sample input is an array and a string:
            -The identified Input Template is: (Array, String).
            -A valid line MUST look like: 4 10 20 30 40 hello_world.
            -A line like 4 10 20 30 40 is a COMPLETE FAILURE because the string is missing.
            -**CRITICAL MANDATE: EVERY SINGLE ONE of the 15 generated input lines MUST perfectly match the Input Template in number, type, and order of parameters. NO PARAMETERS MAY BE ADDED OR OMITTED. EVER**.
            
        ---

        # PROBLEM SPECIFICATION SECTION

        {description}

        ---

        # FINAL CHECKLIST

        - [x] Exactly 15 Input Lines?
        - [x] First \\(S\\) inputs are sample test cases, correctly formatted?
        - [x] Generated input sizes ≤ 30% of max constraints?
        - [x] All collections have size prefixes?
        - [x] Element counts match prefixes exactly?
        - [x] Input parameter order matches `sample_testcases`?
        - [x] Is there any extra text, code,backticks, explanation or any extra text? No
    """

    try:

        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt3}],
            temperature=0.2,
            max_completion_tokens=8192,
            top_p=0.98,
            stream=False,
            stop=None,
        )

        raw_content = completion.choices[0].message.content
        raw_content = raw_content.strip().replace("```json", "").replace("```", "")
        print(raw_content)

        match = re.search(r"\{.*\}", raw_content, re.DOTALL)
        if match:
            json_str = match.group()
            try:
                response = json.loads(json_str)
                if "input" in response:
                    test_cases_str = response["input"]
                    print("Generated test cases string:", test_cases_str)
                    return test_cases_str
                else:
                    print("JSON does not contain 'input' key")
            except json.JSONDecodeError as e:
                print("JSON decode error:", e)
                print("Raw JSON string was:", repr(json_str))
                response = None
        else:
            print("No JSON object found in the LLM output")
            response = None

    except Exception as e:
        print("Error during API call:", e)

    if not response:
        raise Exception("Failed to generate test cases from description")

@api_view(["POST"])
def get_test_cases(request):
    if request.method == "POST":
        description = request.data.get("description")
        question_number = description["question_number"]
        print(f"Received question number: {question_number}")
        if not description:
            return Response({"error": "Description is required"}, status=400)

        # if Testcase.objects.filter(question_number=question_number).exists():
        #     test = Testcase.objects.get(question_number=question_number)
        #     output = {
        #         "input": test.input,
        #         "output": test.output
        #     }
        #     return Response(output, status=200)
        try:
            if isinstance(description, dict):
                extracted_description = json.dumps(description, indent=2)
            else:
                extracted_description = description
            test_cases = get_python_code(extracted_description)

            print(f"Generated test cases: {test_cases}")

            print(question_number)

            input_formate = format(description, test_cases.split("\n"))
            input_formate = input_formate.text.replace("```json", " ")
            input_formate = input_formate.replace("```", " ")

            input_formate = json.loads(input_formate)
            with transaction.atomic():
                
                leetcode_problem = Leetcode_Description.objects.select_for_update().get(number=question_number)
                
                leetcode_problem.input_description = input_formate["input_format_explanation"]
                leetcode_problem.save() 
                output = get_output(
                    description,
                    test_cases,
                    input_formate["input_format_explanation"],
                )

                new_test_cases = Testcase.objects.update_or_create(
                    question_number=question_number,
                    defaults={"input": output["input"], "output": output["output"]},
                )
            return Response(output, status=200)
        except Exception as e:
            print(f"Exception in get_test_cases: {str(e)}")
            return Response({"error": str(e)}, status=500)

def get_output(description, testcase, input_format):
    prompt_solver = f"""
    You are a deterministic JSON-producing system. Your function is to accept a problem definition and a block of text-based test cases, solve them exactly as described, and return a single, perfectly formatted JSON object according to the following contract.

    # ABSOLUTE OUTPUT CONTRACT
    Failure to follow *any* term renders the response invalid.

    ### Term 1: Output Format
    Respond with ONLY a single, raw, syntactically correct JSON object. No markdown, explanations, extra text, or comments—just the JSON.

    ### Term 2: JSON String Values and Newlines
    The JSON object MUST contain exactly these two keys:
    1.  "input"
    2.  "output"
    The values for both the "input" and "output" keys MUST be valid JSON strings.
    -   Inside a JSON string, a newline character MUST be represented by the two-character escape sequence `\\n`.
    -   Your final output for these keys must not contain raw, unescaped newline characters.

    ### Term 3: "input" Key
    - The "input" value MUST be a valid JSON string: the literal content of `INPUT_BLOCK` below, with every newline (`\n`) replaced by the two-character escape sequence `\\n`. 
    - The string must match the original block content exactly (character-for-character), except with newlines escaped.
    - **IMPORTANT:** *Absolutely no raw line breaks (actual newlines) are allowed in the string. Only use the exact two-character sequence `\\n` to indicate a newline, never actual newlines.*

    ### Term 4: "output" Key
    - The "output" value MUST be a JSON string produced by solving each line in the input according to the problem rules.
    - It must contain exactly one "line" of output for each line of input, separated by `\\n`.
    - **Output Line Format:**
    - If a solution for a single input line consists of multiple values, they MUST be formatted as a single string with values separated by single spaces.
    - **Example:** If a solution is the values `6`, `3`, and `2`, the corresponding output line MUST be the literal string `"6 3 2"`.
    - **DO NOT** use commas, brackets (e.g., `[6, 3, 2]`), or any other delimiters or formatting. The output for a line must be a simple string of space-separated values.
    - **NO raw newlines or line breaks are allowed in the final JSON value—each line is separated ONLY by the `\\n` sequence.**

    ### Term 5: Strict Line Matching
    - **Count Lines:** The number of input lines (including blanks and malformed lines) MUST EXACTLY equal the number of output lines.
    - **Never Skip:** If an input line is blank or malformed, provide a corresponding output line (such as `0` or `invalid_input`). No input line may be skipped; DO NOT OMIT ANY OUTPUT LINES.

    ---
    # 1. PROBLEM DEFINITION

    {description}

    ---
    # 2. INPUT LINE FORMAT

    {input_format}

    ---
    # 3. INPUT_BLOCK

    (For the "input" key: encode the following content, escaping newlines as strictly described. For the "output" key: solve each line and return one output line per corresponding input line.)

    {testcase}

    ---
    ### ABSOLUTE ENCODING REQUIREMENT

    **REMINDER AND EXAMPLE:** - Your JSON string values for "input" and "output" must NEVER contain actual newline characters (hex 0x0A or 0x0D).
    - ONLY encode line breaks as the exact sequence of two characters: `\\n`.
    - **Example:** If the INPUT_BLOCK is:
    foo
    bar
    baz
    Then `"input"` must be: `"foo\\nbar\\nbaz"`
    (and ***must NOT*** use a real line break anywhere in the value).

    ---
    Execute. Return ONLY the required JSON—with exact structure and perfectly encoded newlines per contract.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response1 = model.generate_content(prompt_solver)
    response3 = response1.text.replace("```json", "")
    response3 = response3.replace("```", "")
    response3 = json.loads(response3)
    return response3

def format(description, list1):
    str1 = "\n".join(list1)
    prompt2 = f"""
        You are an expert parsing system for competitive programming problems. Your sole function is to analyze a problem's description and raw test case inputs to produce a human-readable explanation of the input format. You must determine how the raw, single-line string of a test case maps to the data structures and variables described in the problem.
        Your Task:
        You will be given two pieces of information:

        Problem JSON (<PROBLEM_JSON>): A JSON object containing the full problem details, including description, constraints, and format information from a platform like LeetCode.
        Test Cases (<TEST_CASES>): A block of 5 separate, single-line raw test cases.
        Based on this information, you must generate a single, valid JSON object and nothing else. Extraneous text, explanations, or conversational filler are strictly forbidden.

        Output Requirements:

        The output must be a valid JSON object.
        The JSON object must contain a single key: "input_format_explanation".
        The value for this key must be a string that provides a clear, precise, and accurate step-by-step description of how to parse the raw, single-line test case.
        The explanation must connect the elements in the raw input string to the variables and data structures mentioned in the <PROBLEM_JSON> (e.g., N, M, grid, queries). It should describe the order, type, and meaning of each part of the input.
        The explanation must be detailed enough for a programmer to write code that correctly reads the input.

        Crucial Example
        To ensure you understand the required output format and precision, here is an example.

        EXAMPLE INPUT:

        <PROBLEM_JSON>
        {{
        "title": "Matrix and Queries",
        "description": "You are given a matrix of size N x M. After the matrix, you are given Q queries. Each query consists of two integers, r and c. For each query, find the value at matrix[r][c].",
        "input_format": "The first line contains two integers, N and M. The next N lines contain M integers each. The next line contains an integer Q. The next Q lines contain two integers, r and c.",
        "constraints": "1 <= N, M <= 100\n1 <= Q <= 1000"
        }}
        </PROBLEM_JSON>

        <TEST_CASES>
        2 3 1 2 3 4 5 6 2 0 1 1 2
        3 3 9 8 7 6 5 4 3 2 1 1 2 2
        1 1 100 1 0 0
        </TEST_CASES>
        REQUIRED OUTPUT FOR THE EXAMPLE:

        JSON

        {{
        "input_format_explanation": "The input begins with two space-separated integers, N and M, representing the number of rows and columns of the matrix. These are followed by N * M space-separated integers, which represent the elements of the matrix provided in row-major order. After the matrix elements, there is a single integer Q, indicating the number of queries. Finally, this is followed by Q pairs of space-separated integers (r and c), representing the coordinates for each query."
        }}
        Now, analyze the following problem JSON and test cases and generate the required JSON output.

        <PROBLEM_JSON>
        {description}
        </PROBLEM_JSON>

        <TEST_CASES>
        {str1}
        </TEST_CASES>
        """

    model = genai.GenerativeModel("gemini-2.5-flash")
    return model.generate_content(prompt2)
