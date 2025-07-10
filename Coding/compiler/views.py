import subprocess
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from Test.models import Contest,Challenges,User,Rank
from .models import Score
import json
from django.http import JsonResponse
from datetime import datetime,date,time as dt_time
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
import re
import os
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response

#New Code Added
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash-latest')

@api_view(['GET'])
def testcases(request):
    question_number=request.get('question_number')
    description,val=get_leetcode_problem_description(question_number)
    code=get_python_code(description)
    file_name="code.py"
    with open("code.py","w") as file:
        file.write(code)
        file.flush()
    execute_command ='python code.py'
    execute_process = subprocess.Popen(execute_command, shell=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE, stderr=subprocess.PIPE,text=True)    
    execute_stdout, execute_stderr = execute_process.communicate()
    if execute_process.returncode != 0:
        return Response({"error": "Error in code execution", "details": execute_stderr}, status=500)
    test_cases = execute_stdout.strip().split('\n')
    list1=test_cases[19:]
    get_cpp_code= get_CPP_code(val, list1)

    #The Code for the C++ code functioning is remaining

    
def get_leetcode_slug_map():
    url = "https://leetcode.com/api/problems/all/"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    response = requests.get(url, headers=headers)
    data = response.json()

    id_to_slug = {}
    for q in data["stat_status_pairs"]:
        qid = q["stat"]["frontend_question_id"]
        slug = q["stat"]["question__title_slug"]
        id_to_slug[qid] = slug
    return id_to_slug

def get_leetcode_problem_data(question_number):

    id_slug=get_leetcode_slug_map()
    title_slug=id_slug[question_number]

    graphql_url = "https://leetcode.com/graphql"
    query = {
        "operationName": "questionData",
        "variables": { "titleSlug": title_slug },
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
        """
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.post(graphql_url, json=query, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(f"Request failed with status {response.status_code}")

    json_response = response.json()
    if "data" not in json_response or not json_response["data"].get("question"):
        raise ValueError(f"Could not fetch data for slug: {title_slug}. Response: {json_response}")

    question_data = json_response["data"]["question"]

    return question_data["content"]

def get_leetcode_problem_description(question_number):

    description_html = get_leetcode_problem_data(53)
    prompt = f"""
    You are an expert LeetCode assistant AI designed to transform raw LeetCode problem content into two precise outputs:

    1. A fully structured JSON object strictly adhering to a predefined schema.

    You are provided with the HTML content of a LeetCode problem. Your task is to parse and extract meaningful components to build both outputs.

    ---

    ## 📦 JSON OBJECT REQUIREMENTS

    Output the following JSON fields:

    {{
    "description": "...",
    "input_format": "...",
    "output_format": "...",
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

    - **description**: The full problem statement written in clear natural English (cleaned from HTML).
    - **input_format**: Describe the nature of the input using natural phrases (e.g., "An array of integers").
    - **output_format**: Describe the expected output (e.g., "An integer representing ...").
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

    response = model.generate_content(prompt)
    val=json.loads(response.text)
    del val['sample_testcases']
    return response.text, val

def get_python_code(description):

    prompt2=f"""
    You are an expert Python programmer creating test case generators for competitive programming problems. Your generated Python script MUST run without ANY errors and produce exactly 20 test cases.

    CRITICAL RESTRICTION: You are ONLY generating test input data, NOT solving the problem. Do NOT import any problem-solving libraries. ONLY use basic Python functionality (random, string) for test case generation.

    PRIMARY OBJECTIVE:
    Generate a Python script that creates exactly 20 test cases formatted as single-line, space-separated values compatible with C++ cin parsing.

    TEST CASE DISTRIBUTION:
    - 5 Basic Cases: Small sizes (1-10 elements)
    - 5 Edge Cases: Boundary testing (min/max constraint values) - ALL DIFFERENT
    - 5 Moderate Cases: Medium sizes (30%-80% of max constraint)
    - 3 Large Cases: Near-maximum sizes (90%-99% of max constraint)
    - 2 Stress Cases: Maximum constraint sizes - BOTH DIFFERENT

    SIZE PREFIXING RULES:

    MANDATORY: For ANY collection of data (arrays, lists, matrices, vectors, sets, sequences, etc.), ALWAYS prefix with dimensional size information: {{dimension_sizes}} {{element1}} {{element2}} ... {{elementN}}

    CRITICAL ELEMENT COUNT MATCHING RULE:
    THE NUMBER OF ELEMENTS GENERATED MUST EXACTLY EQUAL THE SIZE PREFIX(ES) DECLARED.
    - If you declare size N, you MUST generate EXACTLY N elements
    - If you declare dimensions M x N, you MUST generate EXACTLY M*N elements
    - If you declare dimensions D1 x D2 x D3, you MUST generate EXACTLY D1*D2*D3 elements
    - NO EXCEPTIONS - the element count must mathematically match the declared dimensions

    IMPORTANT NOTE: Sample test cases provided are ONLY for reference to understand the problem context. They do NOT dictate the input format requirements. You MUST still apply size prefixing rules regardless of how sample test cases are formatted.

    Dimension-based size prefixing:
    - 1D Collections: {{size}} {{elements...}} → EXACTLY {{size}} number of elements must follow
    - 2D Collections: {{rows}} {{cols}} {{elements...}} → EXACTLY {{rows*cols}} number of elements must follow (row by row)
    - 3D Collections: {{dim1}} {{dim2}} {{dim3}} {{elements...}} → EXACTLY {{dim1*dim2*dim3}} number of elements must follow (flattened in order)
    - nD Collections: {{dim1}} {{dim2}} ... {{dimN}} {{elements...}} → EXACTLY {{dim1*dim2*...*dimN}} number of elements must follow (flattened in order)

    This rule applies to ALL data structures containing multiple elements, regardless of:
    - Dimension (1D, 2D, 3D, nD)
    - Data type (integers, strings, floats, etc.)
    - Collection type (array, list, vector, matrix, set, etc.)
    - Input format description (even if size seems obvious or fixed)
    - How sample test cases are formatted (sample cases are just examples, NOT format specifications)

    Examples:
    - 1D Array [5, 3, 8] → Output: "3 5 3 8" (size=3, then EXACTLY 3 elements)
    - 1D List of numbers [1, 7, 2] → Output: "3 1 7 2" (size=3, then EXACTLY 3 elements)
    - Single integer 42 → Output: "42" (no size prefix for single values)
    - 2D Matrix (2x3) [[1,2,3],[4,5,6]] → Output: "2 3 1 2 3 4 5 6" (rows=2, cols=3, then EXACTLY 2*3=6 elements row by row)
    - 2D Matrix (3x2) [[1,2],[3,4],[5,6]] → Output: "3 2 1 2 3 4 5 6" (rows=3, cols=2, then EXACTLY 3*2=6 elements row by row)
    - 2D Square matrix (3x3) [[1,2,3],[4,5,6],[7,8,9]] → Output: "3 3 1 2 3 4 5 6 7 8 9" (rows=3, cols=3, then EXACTLY 3*3=9 elements row by row)
    - 3D array (2x3x4) → Output: "2 3 4 elem1 elem2 ... elem24" (dim1=2, dim2=3, dim3=4, then EXACTLY 2*3*4=24 elements)
    - 1D Vector of 5 elements [10,20,30,40,50] → Output: "5 10 20 30 40 50" (size=5, then EXACTLY 5 elements)
    - 1D Set {{7,3,9}} → Output: "3 7 3 9" (size=3, then EXACTLY 3 elements)
    - 1D String array ["hello","world","test"] → Output: "3 hello world test" (size=3, then EXACTLY 3 elements)
    - Grid of Chars [['A','B'],['C','D']] → Output: "2 2 A B C D" (each char is a space-separated element)

    PROBLEM CONTEXT ANALYSIS:

    When analyzing the problem, you must:
    1. Read the problem description to identify what INPUT data structures are needed
    2. Ignore how sample test cases are formatted - they are just examples of expected problem behavior
    3. **CRITICAL EXCEPTION**: A single string variable (e.g., a "word" to be searched for) is **NOT** a collection and should **NOT** be prefixed with its length. It should be appended directly.
    4. Focus on what the algorithm needs as input to solve the problem
    5. Apply size prefixing rules to ALL collections regardless of sample format
    6. ALWAYS ensure element count matches declared size EXACTLY

    For example:
    - If problem mentions "two arrays" → Generate: size1 array1_elements (EXACTLY size1 elements) size2 array2_elements (EXACTLY size2 elements)
    - If problem mentions "matrix" → Generate: rows cols matrix_elements (EXACTLY rows*cols elements)
    - If problem mentions "list of integers" → Generate: size list_elements (EXACTLY size elements)
    - Even if sample shows "l1 = [2,4,3], l2 = [5,6,4]" → Still generate: "3 2 4 3 3 5 6 4" (3 elements + 3 elements)

    CRITICAL DIMENSIONAL ANALYSIS RULES:

    BEFORE generating any code, you MUST analyze the input format specification to determine:

    1. DIMENSIONAL INDEPENDENCE DETECTION:
    - Look for indicators that dimensions can vary INDEPENDENTLY:
        * "m x n matrix" (m ≠ n allowed)
        * "rows x cols matrix" (rows ≠ cols allowed)
        * "height x width grid" (height ≠ width allowed)
        * "r rows and c columns" (r ≠ c allowed)
        * Separate constraint ranges for different dimensions
    - Look for indicators that dimensions are DEPENDENT:
        * "n x n matrix" (square matrix only)
        * "size x size grid" (square grid only)
        * "square matrix of size n"
        * Same constraint variable used for multiple dimensions

    2. CONSTRAINT PARSING LOGIC:
    - If constraints specify DIFFERENT variables for dimensions (e.g., "1 <= m <= 10, 1 <= n <= 20"):
        → Generate matrices with INDEPENDENT row and column sizes
        → rows can be different from cols in the same test case
    - If constraints specify SAME variable for dimensions (e.g., "1 <= n <= 10" for "n x n matrix"):
        → Generate square matrices only
        → rows must equal cols in every test case

    3. SIZE GENERATION STRATEGY:
    - For INDEPENDENT dimensions: Generate each dimension separately using its own constraint range
    - For DEPENDENT dimensions: Generate one size value and use it for all dependent dimensions


    ## PROBLEM CONTEXT IS KING:
    -The **PROBLEM SPECIFICATION SECTION** provided at the end is the **ultimate source of truth**. You MUST adapt the generation logic in the template below to fit the data types (integers, strings, etc.) and structures (1D array, 2D matrix, etc.) described in the PROBLEM SPECIFICATION SECTION. Do not blindly copy the template's examples if the problem requires a different data type.


    ENHANCED PYTHON SCRIPT TEMPLATE:

    ```python
    import random
    import string

    def generate_test_cases(list1):
        ## Generates a list of 20 test cases based on the defined structure.
        ## This function should be adapted for each specific problem.

        test_cases = []

        # --------------------------------------------------------------------------
        # STEP 1: DEFINE PROBLEM-SPECIFIC CONSTRAINTS
        # Fill these placeholders with the actual constraints from the problem statement.
        # --------------------------------------------------------------------------

        # Example for a 1D array of integers:
        # N_MIN, N_MAX = 1, 10**5
        # VAL_MIN, VAL_MAX = -10**9, 10**9

        # Example for a 2D matrix (M x N):
        # M_MIN, M_MAX = 1, 100
        # N_MIN, N_MAX = 1, 100
        # VAL_MIN, VAL_MAX = 0, 1

        # Example for an array of strings:
        # ARRAY_LEN_MIN, ARRAY_LEN_MAX = 1, 10**4
        # STR_LEN_MIN, STR_LEN_MAX = 1, 100


        # --------------------------------------------------------------------------
        # STEP 2: IMPLEMENT THE GENERATION LOGIC FOR EACH CASE TYPE
        # Adapt the code inside each loop to generate the correct data format.
        # --------------------------------------------------------------------------

        # -- Basic Cases (5) --
        # Goal: Small, simple inputs.
        for i in range(5):
            random.seed(42 + i)
            # --- [IMPLEMENT BASIC CASE GENERATION LOGIC HERE] ---
            # Example:
            # n = random.randint(N_MIN, min(10, N_MAX))
            # elements = [random.randint(VAL_MIN, VAL_MAX) for _ in range(n)]
            # test_case = f"{{n}} {{' '.join(map(str, elements))}}"
            # test_cases.append(test_case)
            #list1.append(test_case)
            pass # Remove this line after implementing

        # -- Edge Cases (5) --
        # Goal: Test boundary conditions (min/max sizes, special values).
        # Ensure these 5 cases are all different and test meaningful boundaries.
        for i in range(5):
            random.seed(42 + i + 5)
            # --- [IMPLEMENT EDGE CASE GENERATION LOGIC HERE] ---
            # Example: Test min size, max size, etc.
            # if i == 0:
            #     n = N_MIN
            # elif i == 1:
            #     n = N_MAX
            # # ... add other edge conditions
            # elements = [random.randint(VAL_MIN, VAL_MAX) for _ in range(n)]
            # test_case = f"{{n}} {{' '.join(map(str, elements))}}"
            # test_cases.append(test_case)
            pass # Remove this line after implementing

        # -- Moderate Cases (5) --
        # Goal: Test average-sized inputs, between 30% and 80% of max constraints.
        for i in range(5):
            random.seed(42 + i + 10)
            # --- [IMPLEMENT MODERATE CASE GENERATION LOGIC HERE] ---
            # Example:
            # n = random.randint(int(0.3 * N_MAX), int(0.8 * N_MAX))
            # elements = [random.randint(VAL_MIN, VAL_MAX) for _ in range(n)]
            # test_case = f"{{n}} {{' '.join(map(str, elements))}}"
            # test_cases.append(test_case)
            pass # Remove this line after implementing

        # -- Large Cases (3) --
        # Goal: Test inputs near the maximum constraints, between 90% and 99%.
        for i in range(3):
            random.seed(42 + i + 15)
            # --- [IMPLEMENT LARGE CASE GENERATION LOGIC HERE] ---
            # Example:
            # n = random.randint(int(0.9 * N_MAX), int(0.99 * N_MAX))
            # elements = [random.randint(VAL_MIN, VAL_MAX) for _ in range(n)]
            # test_case = f"{{n}} {{' '.join(map(str, elements))}}"
            # test_cases.append(test_case)
            pass # Remove this line after implementing

        # -- Stress Cases (2) --
        # Goal: Push the solution to its absolute limits with maximum constraints.
        # Both cases should use max constraints but have different random content.
        for i in range(2):
            random.seed(42 + i + 18)
            # --- [IMPLEMENT STRESS CASE GENERATION LOGIC HERE] ---
            # Example:
            # n = N_MAX
            # elements = [random.randint(VAL_MIN, VAL_MAX) for _ in range(n)]
            # test_case = f"{{n}} {{' '.join(map(str, elements))}}"
            # test_cases.append(test_case)
            pass # Remove this line after implementing

        # Ensure exactly 20 test cases are generated.
        # assert len(test_cases) == 20, f"Error: Generated {{len(test_cases)}} cases, but expected 20."
        return test_cases

    def main():
        ## Prints the generated test cases with clear labels.
        list1=[]
        try:
            all_test_cases = generate_test_cases(list1)
            if not all_test_cases or all(tc is None for tc in all_test_cases):
                print("Generation logic not implemented. Please fill in the template.")
                return

            for i, test_case in enumerate(all_test_cases, 1):
                if test_case is None: continue # Skip unimplemented cases

                case_type = "Basic"
                if 5 < i <= 10: case_type = "Edge"
                elif 10 < i <= 15: case_type = "Moderate"
                elif 15 < i <= 18: case_type = "Large"
                elif 18 < i <= 20: case_type = "Stress"

                print(test_case)    
                print(list1)            

        except Exception as e:
            print(f"An error occurred during test case generation: {{e}}")
            print("Please ensure STEP 1 (constraints) and STEP 2 (logic) are correctly implemented.")

    if __name__ == "__main__":
        main()
    ```

    CRITICAL RULES FOR RANDOM VALUE GENERATION:

    1. ALL VALUES MUST BE COMPLETELY RANDOM:
    - Use random.randint(min_constraint, max_constraint) for every single value
    - EVERY element must be independently generated - NO repetition
    - NO ascending patterns like [1,2,3,4,5]
    - NO descending patterns like [5,4,3,2,1]
    - NO repetitive patterns like [1,2,1,2,1,2]
    - NO filling arrays with same value repeated (like [max_val] * size)
    - Each element must be random.randint(val_min, val_max) or random string generation - not a repeated value

    2. RANDOM SEED MANAGEMENT:
    - Use different seeds for each test case to ensure diversity
    - random.seed(42 + test_case_number) for each test case

    3. CONSTRAINT ADHERENCE:
    - Every generated value must be within [min_constraint, max_constraint]
    - Size constraints must be respected exactly for each dimension independently

    4. DIMENSIONAL CONSISTENCY:
    - For INDEPENDENT dimensions: Generate each dimension separately within its own constraints
    - For DEPENDENT dimensions: Use the same size value for all dependent dimensions
    - Always verify that the total element count matches the declared dimensions EXACTLY

    5. NO PATTERN GENERATION:
    - Do NOT use range() for value generation
    - Do NOT use arithmetic sequences
    - Do NOT use repetitive patterns
    - ONLY use random.randint() for numeric values or appropriate random generation for strings/chars

    MANDATORY VERIFICATION PATTERN FOR COLLECTIONS:

    ```python
    # For 1D Collections:
    size = random.randint(min_size, max_size)
    values = [random.randint(min_val, max_val) for _ in range(size)]  # EXACTLY size elements
    output = f"{{size}} {{' '.join(map(str, values))}}"

    # For 1D String Collections:
    size = random.randint(min_size, max_size)
    strings = [''.join(random.choices(string.ascii_lowercase, k=random.randint(min_len, max_len))) for _ in range(size)]  # EXACTLY size strings
    output = f"{{size}} {{' '.join(strings)}}"

    # For 2D Collections with INDEPENDENT dimensions:
    rows = random.randint(min_rows, max_rows)
    cols = random.randint(min_cols, max_cols)  # Can be different from rows
    total_elements = rows * cols  # Calculate exact count needed
    elements = [random.randint(min_val, max_val) for _ in range(total_elements)]  # EXACTLY rows*cols elements
    output = f"{{rows}} {{cols}} {{' '.join(map(str, elements))}}"

    # For 2D Collections with DEPENDENT dimensions (square matrices):
    size = random.randint(min_size, max_size)
    total_elements = size * size  # Calculate exact count needed
    elements = [random.randint(min_val, max_val) for _ in range(total_elements)]  # EXACTLY size*size elements
    output = f"{{size}} {{size}} {{' '.join(map(str, elements))}}"

    # For 3D Collections with INDEPENDENT dimensions:
    d1 = random.randint(min_d1, max_d1)
    d2 = random.randint(min_d2, max_d2)  # Can be different from d1
    d3 = random.randint(min_d3, max_d3)  # Can be different from d1 and d2
    total_elements = d1 * d2 * d3  # Calculate exact count needed
    elements = [random.randint(min_val, max_val) for _ in range(total_elements)]  # EXACTLY d1*d2*d3 elements
    output = f"{{d1}} {{d2}} {{d3}} {{' '.join(map(str, elements))}}"
    ```

    ELEMENT COUNT VERIFICATION CHECKLIST:

    Before outputting any test case, VERIFY:
    1. Count the declared size(s) in the prefix
    2. Calculate total elements needed (multiply all dimensions)
    3. Count actual elements generated
    4. Ensure: declared_total == actual_element_count
    5. If mismatch detected, regenerate with correct count

    EXAMPLE VERIFICATION:
    - If output starts with "5 3", then total elements needed = 5 * 3 = 15
    - Count elements after "5 3": must be exactly 15 elements
    - If output starts with "7", then total elements needed = 7
    - Count elements after "7": must be exactly 7 elements

    INPUT PARSING LOGIC:

    1. ANALYZE INPUT FORMAT SPECIFICATION:
    - Look for dimensional indicators: "m x n", "rows x cols", "height x width"
    - Check if different variables are used for different dimensions
    - Determine if dimensions can vary independently or are constrained to be equal

    2. PARSE CONSTRAINTS:
    - Extract constraint ranges for each dimension separately
    - If same variable used for multiple dimensions → dependent dimensions
    - If different variables used → independent dimensions

    3. COLLECTION TYPE IDENTIFICATION:
    - Single primitive values (like "integer n", "float x") → no size prefix
    - 1D collections → {{size}} prefix required + EXACTLY {{size}} elements
    - 2D collections → {{dim1}} {{dim2}} prefix required + EXACTLY {{dim1*dim2}} elements (can be different values)
    - 3D collections → {{dim1}} {{dim2}} {{dim3}} prefix required + EXACTLY {{dim1*dim2*dim3}} elements (can be different values)
    - nD collections → {{dim1}} {{dim2}} ... {{dimN}} prefix required + EXACTLY {{product of all dims}} elements (can be different values)

    4. DIMENSIONAL RELATIONSHIP DETECTION:
    - "n x n matrix" → dependent dimensions (square matrix) → generate size*size elements
    - "m x n matrix" with separate m,n constraints → independent dimensions (rectangular matrix) → generate m*n elements
    - "array of size n" → 1D collection → generate n elements
    - "grid of height h and width w" → independent dimensions → generate h*w elements

    PROBLEM SPECIFICATION SECTION:
    {description}

    FINAL REQUIREMENTS:
    - Script must run without ANY errors
    - Must generate exactly 20 test cases
    - All test cases must be different (especially in dimensions when independent)
    - All constraints must be respected for each dimension separately
    - Size prefixes must match actual element counts for ALL collections EXACTLY - NO EXCEPTIONS
    - For 1D collections: output as "size element1 element2 ... elementN" where element count = size
    - For 2D+ collections: output as "dim1 dim2 ... dimN element1 element2 ... elementN" where element count = dim1*dim2*...*dimN
    - ALL VALUES MUST BE RANDOM - NO PATTERNS
    - Output format: single line per test case, space-separated
    - For independent dimensions: Generate variety in dimensional combinations (rectangular shapes)
    - For dependent dimensions: Focus on content variety while maintaining dimensional constraints
    - IGNORE sample test case formatting - apply size prefixing rules regardless
    - DO NOT import any problem-solving libraries - only basic Python functionality
    - MATHEMATICAL VERIFICATION: declared_size_product MUST EQUAL actual_element_count for every test case

    Generate ONLY the complete, error-free Python script with RANDOM value generation, proper dimensional analysis, and EXACT element count matching. No explanations, no comments about the prompt - just the working code.
    """

    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content(prompt2)
    return response.text

def get_CPP_code(val, list1):

    prompt3=f"""
    You are an expert C++ programmer and a master of algorithm design. Your task is to write a complete, single-file C++ solution for the problem described below. Your code must be robust, generalized, and should not be hardcoded for specific examples.

    ** Problem Description : **
    {val}

    ### 2. Input Format Specification

    Your C++ code's `main()` function must parse input delivered as a single stream of **space-separated values**. You should use standard input streams (e.g., `std::cin`) to read the data.

    **Input Structure:**
    The input will be provided in the following specific order, with each item separated by one or more spaces:
    1.  An integer `m` (the number of rows in the grid).
    2.  An integer `n` (the number of columns in the grid).
    3.  `m * n` characters, representing the grid's content, provided in row-major order.
    4.  The string `word` to be searched for in the grid.

    **Example Input:**
    For a grid `[['A','B','C'],['S','F','S']]` and the word `SEE`, the corresponding space-separated input stream would be:
    `2 3 A B C S F S SEE`

    **Guiding Principle for Deduction:**
    -When you analyze the sample test cases, you should look for a general, underlying pattern. As a universal hint for the problems you'll receive, this pattern is:
    -Multi-Element Collections (e.g., vectors, arrays): Are always preceded in the input stream by their dimension(s) as integers. A 1D collection will be preceded by its size; a 2D collection by its rows and columns.
    -Single Values (e.g., int, std::string): Are given directly in the input stream without any preceding size integer.
    -Your generated code must be a direct implementation of the format you deduce by applying this principle to the problem description and the provided test cases.


    Your parsing logic must be robust enough to handle any valid input that follows this structure, not just the example provided. The sample test cases in the next section will also adhere to this space-separated format.

    **Sample Test Cases (for logic validation):**
    {list1}

    ### 3. Code Generation Requirements

    * Generate a complete C++ solution in a single code block.
    * The solution must include a `main()` function.
    * The `main()` function must contain all necessary code to read the input according to the **space-separated format** specified above.
    * Implement the full logic required to solve the problem efficiently using a backtracking algorithm.
    * Adhere to modern C++ best practices (e.g., use `<vector>`, `<string>`, `<iostream>`).
    * Do not add any explanatory text or comments outside of the code block in your final output.
    """
    response2 = model.generate_content(prompt3)
    return response2.text


#OLD Code
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
    
def submit(request):
    if request.method=="POST":
        contest_id=request.POST.get('contest_id')
        user=request.POST.get('user')
        if request.POST.get('value')=="Already Submitted" or request.POST.get('value')=="Contest Ended":
            return render(request,'result.html',{'user':user,'contest_id':contest_id,"success":True})
        seconds=int(request.POST.get('time'))
        score=Score.objects.get(user=user,contest=contest_id)
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        score.time=dt_time(hour=hours, minute=minutes, second=secs)
        score.save()
        return render(request,'result.html',{'user':user,'contest_id':contest_id,"success":True})

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
        contest_id = request.POST.get('contest')
        user_id = request.POST.get('user')
        time = datetime.now().strftime("%H:%M:%S")
        return render(request, 'start.html', {"contest_id": contest_id, "user": user_id, "time": time})
    return render(request, 'start.html')


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
    
def result(request):
    user = request.POST.get('user')
    contest_id = request.POST.get('contest_id')
    c = Contest.objects.get(id=contest_id)
    start_dt = datetime.combine(date.today(), c.end_time)
    now = datetime.now()
    diff = int((now - start_dt).total_seconds())
    rank = Score.objects.filter(contest=contest_id).order_by('-score', 'time')
    rank_data = []
    for i, score_obj in enumerate(rank):
        rank_data.append({
            'Rank': i + 1,
            'Name': score_obj.user.full_name,
            'Email': score_obj.user.email,
            'Score': score_obj.score,
            'Time': str(score_obj.time)
        })
        if diff > 5: 
            rank1, created = Rank.objects.get_or_create(user=score_obj.user)
            if rank1.rank is None:
                rank1.rank = []
            rank1.rank[contest_id]=i+1
            rank1.save()
    if diff > 5:
        return JsonResponse({'ranks': rank_data, "success": False})
    return JsonResponse({'ranks': rank_data, "success": True})




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
