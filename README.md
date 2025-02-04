<h1>CodeSphere - Online Competitive Programming Platform </h1>
<h3>Overview</h3>
<p>
CodeSphere is an online competitive programming platform built using Django. It provides an interactive coding environment where users can write, compile, and execute 
code in multiple programming languages like Java and Python. The platform supports coding challenges, contests, user rankings, and problem submissions. Additionally, 
it offers real-time code execution, test case evaluations, and a leaderboard system to track user performance.
</p>

<h3>Getting Started</h3>
<p>
Follow these steps to set up the project on your local machine.
<h3><b>1. Clone the Repository</b></h3>![image](https://github.com/user-attachments/assets/ed2b7702-dced-4219-8b4c-280fd1e6e25f)

<pre>
git clone https://github.com/yourusername/CodeSphere.git
cd CodeSphere
</pre>
<h3><b>2. Install Java and Python</b></h3>
Since the website uses subprocess.popen() for executing code in different languages, ensure that both Java and Python are installed on your system.

<b>Install Java</b>
-Download and install Java from Oracle or OpenJDK.
-Verify installation:
-<pre>java -version</pre>
<b>Install Python</b>

-Download and install Python from Python.org.
-Verify installation:
-<pre>python --version</pre>

<h3><b>3. Create and Activate Virtual Environment</b></h3>

It is recommended to use a virtual environment to manage dependencies.
Windows
<pre>python -m venv env
env\Scripts\activate</pre>
Mac/Linux
<pre>python3 -m venv env
source env/bin/activate</pre>

<h3><b>4. Install Dependencies</b></h3>
All required packages are listed in requirements.txt. Install them using:
<pre>pip install -r requirements.txt</pre>

<h3><b>5. Database Setup</b></h3>

Since the database is not included in the repository (ignored via .gitignore), you need to set up a new database manually.
<b>a) Apply Migrations</b>
<pre>python manage.py migrate</pre>

<b>b) Create a Superuser (Optional, for Admin Access)</b>
<pre>python manage.py createsuperuser</pre>

<h3><b>6. Running the Project</b></h3>
Start the Django development server:
<pre>python manage.py runserver</pre>

<h3><b>7. Environment Variables</b></h3>

As the project requires environment variables (e.g., database credentials, API keys), create a .env file in the root directory and define them there.

</p>
