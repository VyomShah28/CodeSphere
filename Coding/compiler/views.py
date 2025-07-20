import subprocess
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from Test.models import Contest, Challenges, User, Rank
from .models import Score, Testcase, Leetcode_Description, slug_map
import json
from django.http import JsonResponse
from datetime import datetime, date, timedelta, time as dt_time
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
import re
import os
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
import platform
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
import tempfile
import time as time_mod
from groq import Groq


# New Code Added
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
print("API Key Configured Successfully")
model = genai.GenerativeModel("gemini-1.5-flash-latest")


@api_view(["GET"])
def testcases(request):
    question_number = request.get("question_number")
    description, val = get_leetcode_problem_description(question_number)
    code = get_python_code(description)
    file_name = "code.py"
    with open("code.py", "w") as file:
        file.write(code)
        file.flush()
    execute_command = "python code.py"
    execute_process = subprocess.Popen(
        execute_command,
        shell=True,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    execute_stdout, execute_stderr = execute_process.communicate()
    if execute_process.returncode != 0:
        return Response(
            {"error": "Error in code execution", "details": execute_stderr}, status=500
        )
    test_cases = execute_stdout.strip().split("\n")
    list1 = test_cases[19:]
    # get_cpp_code = get_CPP_code(val, list1)

    # The Code for the C++ code functioning is remaining


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

    print(response)

    val = json.loads(response.text)

    del val["sample_testcases"]
    return response.text, val


def get_python_code(description):
    response=None
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
        - [x] Is there any extra text, code, or explanation? ❌ No
    """

    try:

        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        completion = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{"role": "user", "content": prompt3}],
            temperature=0.4,
            max_completion_tokens=8192,
            top_p=0.95,
            stream=False,
            stop=None,
        )

        raw_content = completion.choices[0].message.content

        raw_content = completion.choices[0].message.content

        start_index = raw_content.find("{")

        if start_index != -1:
            clean_output = raw_content[start_index:]
            print(clean_output)
        else:
            print(raw_content)

        raw_content = clean_output
        raw_content = raw_content.replace("```", "")

        response = json.loads(raw_content)
        print("Generated test cases:", response)
        return response
    except Exception as e:
        print("Error during API call:", e)

    if not response:
        raise Exception("Failed to generate test cases from description")


# API


@api_view(["POST"])
def get_leetcode_problem_description(request):

    if request.method == "POST":
        question_number = request.data.get("question_number")
        question_number = int(question_number)

        if Leetcode_Description.objects.filter(number=question_number).exists():
            print("Fetching from database")
            leetcode = Leetcode_Description.objects.get(number=question_number)
            description = leetcode.description
            val = json.loads(description)
            del val["sample_testcases"]

            return Response({"question": val, "challange": description}, status=200)

        if not question_number:
            return Response({"error": "Question number is required"}, status=400)

        try:
            description, val = get_leetcode_problem_description_Gemini(question_number)
            print(type(description), type(val))
            print(f"Received description type: {json.loads(description)}")

            leetcode = Leetcode_Description(
                number=question_number,
                description=description,
            )
            leetcode.save()
            return Response({"question": val, "challange": description}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    return Response({"error": "Invalid request method"}, status=405)


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

            input_formate=format(description, test_cases["input"].split("\n"))
            input_formate = input_formate.text.replace("```json", " ")
            input_formate = input_formate.replace("```", " ")
                
            input_formate = json.loads(input_formate)
            leetcode_problem = Leetcode_Description.objects.get(number=question_number)
            leetcode_problem.input_description = input_formate["input_format_explanation"]
            leetcode_problem.save()

            output=get_output(description, test_cases["input"], input_formate["input_format_explanation"])


            new_test_cases = Testcase.objects.update_or_create(
                question_number=question_number,
                defaults={
                    "input":output["input"],
                    "output":output["output"]
                }
            )

            return Response(output, status=200)
        except Exception as e:
            print(f"Exception in get_test_cases: {str(e)}")
            return Response({"error": str(e)}, status=500)


def get_output(description,testcase,input_format):
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
    - It must contain exactly one "line" per input line, separated by `\\n`—**the actual two characters `\\n`, not a raw newline.**
    - *You must generate a corresponding output line for every input line, in the exact same order.*
    - **NO raw newlines or line breaks are allowed in the JSON value—each line is separated ONLY by `\\n`.**

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

    **REMINDER AND EXAMPLE:**  
    - Your JSON string values for "input" and "output" must NEVER contain actual newline characters (hex 0x0A or 0x0D).
    - ONLY encode line breaks as the exact sequence of two characters: `\\n`.
    - **Example:** If the INPUT_BLOCK is:
    foo
    bar
    baz

    text
    Then `"input"` must be: `"foo\\nbar\\nbaz"`
    (and ***must NOT*** use a real line break anywhere in the value).

    ---
    Execute. Return ONLY the required JSON—with exact structure and perfectly encoded newlines per contract.
    """

    model = genai.GenerativeModel('gemini-2.5-flash')
    response1 = model.generate_content(prompt_solver)
    print(response1.text)
    response3=response1.text.replace("```json","")
    response3=response3.replace("```","")
    response3=json.loads(response3)
    return response3

def format(description,list1):
    str1='\n'.join(list1)
    prompt2=f"""
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
    print(model.generate_content(prompt2))
    return model.generate_content(prompt2)


CODE_EXECUTION_TIMEOUT = 5


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


def get_compilers():
    """Returns a list of potential C++ compilers to try and a suitable environment."""
    if platform.system() == "Windows":
        return get_windows_compilers_env()
    else:
        return ["g++", "clang++"], os.environ.copy()


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

    # if language != "cpp":
    #     return Response(
    #         {"success": False, "error": "Only C++ is supported currently."}, status=400
    #     )

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
                ["python", py_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            actual_output, runtime_stderr = execute_process.communicate(input=input_data, timeout=CODE_EXECUTION_TIMEOUT)
            end_time = time_mod.time()
            execution_time = round(end_time - start_time, 4)

            if execute_process.returncode != 0:
                return {"success": False, "error": f"Runtime Error:\n{runtime_stderr.strip()}"}

        except subprocess.TimeoutExpired:
            execute_process.kill()
            return {"success": False, "error": "Time Limit Exceeded"}
        except FileNotFoundError:
            return {"success": False, "error": "Python interpreter not found. Please ensure 'python' is in the system's PATH."}

        if actual_output.strip() == expected_output.strip():
            return {"success": True, "result": {"status": "passed", "output": actual_output.strip(), "execution_time": execution_time, "memory_used": "N/A"}}
        else:
            return {"success": True, "result": {"status": "failed", "actual_output": actual_output.strip(), "expected_output": expected_output.strip(), "execution_time": execution_time, "memory_used": "N/A"}}


def run_java_code(code, input_data, expected_output):
    match = re.search(r'public\s+class\s+(\w+)', code)
    if not match:
        return {"success": False, "error": "Compilation Failed: Could not find a 'public class' declaration in the code."} 
    
    main_class_name = match.group(1)

    with tempfile.TemporaryDirectory() as temp_dir:
        java_path = os.path.join(temp_dir, f"{main_class_name}.java")
        with open(java_path, "w") as source_file:
            source_file.write(code)

        try:
            compile_process = subprocess.Popen(
                ["javac", java_path], cwd=temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            _, compile_stderr = compile_process.communicate(timeout=CODE_EXECUTION_TIMEOUT)
            if compile_process.returncode != 0:
                return {"success": False, "error": f"Compilation Failed:\n{compile_stderr.strip()}"}
        except FileNotFoundError:
            return {"success": False, "error": "JDK not found. Please ensure 'javac' is in the system's PATH."}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Compilation Timed Out"}

        try:
            start_time = time_mod.time()
            execute_process = subprocess.Popen(
                ["java", main_class_name], cwd=temp_dir, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            actual_output, runtime_stderr = execute_process.communicate(input=input_data, timeout=CODE_EXECUTION_TIMEOUT)
            end_time = time_mod.time()
            execution_time = round(end_time - start_time, 4)

            if execute_process.returncode != 0:
                return {"success": False, "error": f"Runtime Error:\n{runtime_stderr.strip()}"}

        except subprocess.TimeoutExpired:
            execute_process.kill()
            return {"success": False, "error": "Time Limit Exceeded"}
        except FileNotFoundError:
            return {"success": False, "error": "JRE not found. Please ensure 'java' is in the system's PATH."}

        if actual_output.strip() == expected_output.strip():
            return {"success": True, "result": {"status": "passed", "output": actual_output.strip(), "execution_time": execution_time, "memory_used": "N/A"}}
        else:
            return {"success": True, "result": {"status": "failed", "actual_output": actual_output.strip(), "expected_output": expected_output.strip(), "execution_time": execution_time, "memory_used": "N/A"}}


def time_to_delta(t):
    return timedelta(hours=t.hour, minutes=t.minute, seconds=t.second)

@api_view(["POST"])
def submit_code(request):
    code = request.data.get("code")
    language = request.data.get("language", "").lower()
    input_data = request.data.get("inputs", "")
    total_mark=int(request.data.get("total_mark", 0))/15
    contest=Contest.objects.get(id=request.data.get("contestId"))
    user=User.objects.get(id=request.data.get("userId"))
    challenge= Challenges.objects.get(id=request.data.get("challengeId", ""))
    time=request.data.get("timeLeft", {})
    print(f"Received time data: {time}")
    hour=int(time["hours"])
    minute=int(time["minutes"])
    second=int(time["seconds"])

    my_time = dt_time(hour, minute, second)

    start_time=datetime.combine(contest.start_date, contest.start_time)
    end_time=datetime.combine(contest.end_date, contest.end_time)

    diff = end_time - start_time - time_to_delta(my_time)
    print(f"Input data: {input_data}")
    expected_output = request.data.get("outputs", "")
    print(f"Expected output: {expected_output}")

    if not code or not language:
        return Response(
            {"success": False, "error": "Code and language are required"}, status=400
        )

    if language == "python":
        solution = submit_python_code(code, input_data, expected_output,total_mark,contest,user,challenge)
        print(f"Solution: {solution}")
        score=Score.objects.get(contest=contest, user=user,challenge=challenge)
        print(f"Score object: {score}")
        score.time=diff
        score.save()
        return Response(solution, status=200)
    
    if language == "java":
        print(diff)
        solution = submit_java_code(code, input_data, expected_output,total_mark,contest,user,challenge)
        score=Score.objects.get(contest=contest, user=user,challenge=challenge)
        total_seconds = int(diff.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        score.time = dt_time(hours, minutes, seconds)
        score.save()
        return Response(solution, status=200)

    # if language != "cpp":
    #     return Response(
    #         {"success": False, "error": "Only C++ is supported currently."}, status=400
    #     )

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
            testcase=input_data.split('\n')
            if Score.objects.filter(contest=contest, user=user,challenge=challenge).exists():
                max_score= Score.objects.get(contest=contest, user=user,challenge=challenge).score
                solve= Score.objects.get(contest=contest, user=user,challenge=challenge).solved
            else:
                max_score=0
                solve={}
            score=0
            for test,out in zip(testcase,expected_output.split('\n')):
                try : 
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
                        return Response(
                            {
                                "success": False,
                                "error": "Runtime Error",
                                "details": runtime_stderr,
                            },
                            status=400,
                        )
                except subprocess.TimeoutExpired:
                    max_score=max(max_score,score)
                    score_obj = Score.objects.update_or_create(
                        contest=contest,
                        user=user,
                        challenge=challenge,
                        defaults={
                            'score': max_score,
                            'solved': solve,
                            'time': diff
                        }
                    )
                    execute_process.kill()
                    return Response(
                        {"success": False, "error": "Time Limit Exceeded"}, status=400
                    )

                if actual_output.strip() != out.strip():
                    max_score=max(max_score,score)
                    score_obj = Score.objects.update_or_create(
                        contest=contest,
                        user=user,
                        challenge=challenge,
                        defaults={
                            'score': max_score,
                            'solved': solve,
                            'time': diff
                        }
                    )
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

                score+=total_mark  
                print("Passed",test) 
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": "Server execution error.",
                    "details": str(e),
                },
                status=500,
            )
        max_score=max(max_score,score)
        solve[challenge.id]=1
        score_obj = Score.objects.update_or_create(
            contest=contest,
            user=user,
            challenge=challenge,
            defaults={
                'score': max_score,
                'solved': solve,
                'time': diff
            }
        )

        return Response({"success":True, "result": {"status": "passed", "execution_time": "0.1ms", "memory_used": "N/A"}}, status=200)


def submit_python_code(code,input_data,expected_output,total_mark,contest,user,challenge):
    with tempfile.TemporaryDirectory() as temp_dir:
        py_path = os.path.join(temp_dir, "source.py")
        with open(py_path, "w") as source_file:
            source_file.write(code)
        
        start_time = time_mod.time()
        
        if Score.objects.filter(contest=contest, user=user,challenge=challenge).exists():
            max_score= Score.objects.get(contest=contest, user=user,challenge=challenge).score
            solve= Score.objects.get(contest=contest, user=user,challenge=challenge).solved
        else:
            max_score=0
            solve={}
        score=0
        for test,out in zip(input_data.split('\n'),expected_output.split('\n')):
            try : 
                execute_process = subprocess.Popen(
                    ["python", py_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
                )
                actual_output, runtime_stderr = execute_process.communicate(input=test, timeout=CODE_EXECUTION_TIMEOUT)
                end_time = time_mod.time()
                execution_time = round(end_time - start_time, 4)
                if execute_process.returncode != 0:
                    return {"success": False, "error": f"Runtime Error:\n{runtime_stderr.strip()}"}

            except subprocess.TimeoutExpired:
                max_score=max(max_score,score)
                score_obj = Score.objects.update_or_create(
                    contest=contest,
                    user=user,
                    challenge=challenge,
                    defaults={
                        'score': max_score,
                        'solved': solve,
                    }
                )
                execute_process.kill()
                return {"success": False, "error": "Time Limit Exceeded"}
            except FileNotFoundError:
                return {"success": False, "error": "Python interpreter not found. Please ensure 'python' is in the system's PATH."}

            if actual_output.strip() != out.strip():
                max_score=max(max_score,score)
                score_obj = Score.objects.update_or_create(
                    contest=contest,
                    user=user,
                    challenge=challenge,
                    defaults={
                        'score': max_score,
                        'solved': solve,
                    }
                )
                return {"success": True, "result": {"status": "failed", "actual_output": actual_output.strip(), "expected_output": expected_output.strip(), "execution_time": execution_time, "memory_used": "N/A"}}
            score+=total_mark
        max_score=max(max_score,score)
        solve[challenge.id]=1
        score_obj = Score.objects.update_or_create(
            contest=contest,
            user=user,
            challenge=challenge,
            defaults={
                'score': max_score,
                'solved': solve,
            }
        )
        return {"success":True, "result": {"status": "passed", "execution_time": "0.1ms", "memory_used": "N/A"}}
                

def submit_java_code(code,input_data,expected_output,total_mark,contest,user,challenge):    
    match = re.search(r'public\s+class\s+(\w+)', code)
    if not match:
        return {"success": False, "error": "Compilation Failed: Could not find a 'public class' declaration in the code."}
    main_class_name = match.group(1)

    with tempfile.TemporaryDirectory() as temp_dir:
        java_path = os.path.join(temp_dir, f"{main_class_name}.java")
        with open(java_path, "w") as source_file:
            source_file.write(code)

        try:
            compile_process = subprocess.Popen(
                ["javac", java_path], cwd=temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            _, compile_stderr = compile_process.communicate(timeout=CODE_EXECUTION_TIMEOUT)
            if compile_process.returncode != 0:
                return {"success": False, "error": f"Compilation Failed:\n{compile_stderr.strip()}"}
        except FileNotFoundError:
            return {"success": False, "error": "JDK not found. Please ensure 'javac' is in the system's PATH."}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Compilation Timed Out"}

        start_time = time_mod.time()
        
        if Score.objects.filter(contest=contest, user=user,challenge=challenge).exists():
            max_score= Score.objects.get(contest=contest, user=user,challenge=challenge).score
            solve= Score.objects.get(contest=contest, user=user,challenge=challenge).solved
        else:
            max_score=0
            solve={}
        score=0
        for test,out in zip(input_data.split('\n'),expected_output.split('\n')):
            try :
                execute_process = subprocess.Popen(
                    ["java", main_class_name], cwd=temp_dir, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
                )
                actual_output, runtime_stderr = execute_process.communicate(input=test, timeout=CODE_EXECUTION_TIMEOUT)
                end_time = time_mod.time()
                execution_time = round(end_time - start_time, 4)

                if execute_process.returncode != 0:
                    return {"success": False, "error": f"Runtime Error:\n{runtime_stderr.strip()}"}
            except subprocess.TimeoutExpired:
                print("Failed Time")
                max_score=max(max_score,score)
                score_obj = Score.objects.update_or_create(
                    contest=contest,
                    user=user,
                    challenge=challenge,
                    defaults={
                        'score': max_score,
                        'solved': solve,
                    }
                )
                execute_process.kill()
                return {"success": False, "error": "Time Limit Exceeded"}
            except FileNotFoundError:
                print('Failed JRE')
                return {"success": False, "error": "JRE not found. Please ensure 'java' is in the system's PATH."}

            if actual_output.strip() != out.strip():
                print(test)
                print(f"Failed Output : {actual_output.strip()}, Actual Output : {out.strip()}")
                max_score=max(max_score,score)
                score_obj = Score.objects.update_or_create(
                    contest=contest,
                    user=user,
                    challenge=challenge,
                    defaults={
                        'score': max_score,
                        'solved': solve,
                    }
                )
                return {"success": True, "result": {"status": "failed", "actual_output": actual_output.strip(), "expected_output": expected_output.strip(), "execution_time": execution_time, "memory_used": "N/A"}}
            score+=total_mark
            print("Passed")
            print(test)
        max_score=max(max_score,score)
        solve[challenge.id]=1
        score_obj = Score.objects.update_or_create(
            contest=contest,
            user=user,
            challenge=challenge,
            defaults={
                'score': max_score,
                'solved': solve,
            }
        )
        return {"success": True, "result": {"status": "passed", "execution_time": execution_time, "memory_used": "N/A"}}

@api_view(["POST"])
def leaderboard(request):
    if request.POST:
        contest_id = request.POST.get("contest")
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
                "Time_taken": str(timedelta(dict2[user_id])),
                "Avatar": User.objects.get(id=user_id).profile_photo,
                "score": score
            })
            rank=Rank(user=User.objects.get(id=user_id),rank={f"{contest_id}":rank+1})
        return Response({"finalRankings": data})
    
    
@api_view(["POST"])
def get_user_progress(request):
    if request.method == "POST":
        print(request.data)
        user_id = request.data.get("user_id")
        
        print(f"Received user_id: {user_id}")
        

        if not user_id:
            return Response({"error": "User ID are required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
            scores = Score.objects.filter(user=user)
            
            if not scores:
                return Response({"error": "No scores found for this user"}, status=200)
            
            stats = []
            contestHistory = []
            
            total_score = 0
            total_rank = 0
            best_rank = 0
            problemSolved = 0
            for score in scores:
                
                total_score += score.score
                total_rank += score.rank
                best_rank = max(best_rank, score.rank)
                problemSolved += score.solved              
                
                contestHistory.append({
                    "id":score.contest.id,
                    "name": score.challenge.name,
                    "date": score.contest.start_date.strftime("%Y-%m-%d"),
                    "rank": score.rank,
                    "score": score.score,
                    "problem":len(Challenges.objects.filter(contest=score.contest.id)),
                    "solved": score.solved,
                    "time": str(score.time),
                    "participants": Contest.objects.get(id=score.contest.id).participants,
                    "status":Contest.objects.get(id=score.contest.id).status,
                })  
            
            stats.append({
                "totalContests": scores.count(),
                "averageRank": total_rank / scores.count() if scores.count() > 0 else 0,
                "totalScore": total_score,
                "bestRank": best_rank,
                "problemsSolved": problemSolved,
            })
            
            data = {
                contestHistory: contestHistory,
                stats: stats,
            }

            return Response(data, status=200)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Contest.DoesNotExist:
            return Response({"error": "Contest not found"}, status=404)


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
