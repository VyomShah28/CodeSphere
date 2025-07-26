<h1>CodeSphere – Online Competitive Programming Platform</h1>

<h2>Overview</h2>
<p>
<b>CodeSphere</b> is a modern, full-stack online competitive programming platform. The main feature is the ability to take contests on real <b>LeetCode</b> problems, with <b>AI-generated test cases</b>. All contests are conducted in a protected environment: <b>no tab switching is allowed</b> (anti-cheat, 3 strikes system). Users can write, compile, and execute code in multiple languages (Java, Python, and more), attempt curated coding challenges, participate in programming contests, and see real-time test case evaluations. Track your performance on leaderboards.
</p>

<hr>

<h2>Features</h2>
<ul>
  <li><b>LeetCode Problem Contests:</b> Participate in contests using real LeetCode problems with AI-generated test cases.</li>
  <li><b>Protected Environment:</b> Secure contests—no tab switching, anti-cheat enabled (3 strikes system).</li>
  <li><b>Multi-language Support:</b> Write code in Java, Python, and more.</li>
  <li><b>Live Code Execution:</b> Secure, real-time code compilation and output.</li>
  <li><b>Real-Time Test Case Evaluation:</b> Get instant feedback on your solutions.</li>
  <li><b>User Rankings and Leaderboard:</b> Climb the leaderboard as you solve challenges.</li>
  <li><b>Admin Dashboard:</b> Manage problems, users, and contests.</li>
</ul>

<hr>

<h2>Getting Started</h2>

<h3>1. Set Up Your Environment</h3>
<ul>
  <li>
    <b>Install Java:</b><br>
    <a href="https://www.oracle.com/java/technologies/downloads/?er=221886" target="_blank">Download from Oracle</a><br>
    Verify installation:<br>
    <code>java -version</code>
  </li>
  <li>
    <b>Install Python:</b><br>
    <a href="https://www.python.org/downloads/" target="_blank">Download from Python.org</a><br>
    Verify installation:<br>
    <code>python --version</code>
  </li>
  <li>
    <b>Install Node.js and npm:</b><br>
    <a href="https://nodejs.org/" target="_blank">Download from Node.js</a><br>
    Verify installation:<br>
    <code>node -v</code><br>
    <code>npm -v</code>
  </li>
  <li>
    <b>(Optional but recommended) Create a Python Virtual Environment</b>
    <ul>
      <li>
        <b>Windows:</b>
        <pre>python -m venv env
env\Scripts\activate</pre>
      </li>
      <li>
        <b>Mac/Linux:</b>
        <pre>python3 -m venv env
source env/bin/activate</pre>
      </li>
    </ul>
  </li>
  <li>
    <b>Install Python dependencies:</b><br>
    <code>pip install -r requirements.txt</code>
  </li>
  <li>
    <b>Set up environment variables:</b><br>
    Create a <code>.env</code> file in the root directory and configure credentials and secrets (database credentials, API keys, etc.).
  </li>
</ul>

<hr>

<h3>2. Database Setup</h3>
<ul>
  <li>
    <b>Apply migrations:</b><br>
    <code>python manage.py migrate</code>
  </li>
  <li>
    <b>(Optional) Create an admin user:</b><br>
    <code>python manage.py createsuperuser</code>
  </li>
</ul>

<hr>

<h3>3. Run the Backend</h3>
<ul>
  <li>
    Start the Django backend server:<br>
    <code>
      cd ./Cping<br>
      python manage.py runserver
    </code>
  </li>
</ul>

<hr>

<h3>4. Run the Frontend</h3>
<ul>
  <li>
    Start the frontend development server:<br>
    <code>
      cd ./Client<br>
      npm install<br>
      npm run dev
    </code>
  </li>
</ul>

<hr>

<h2>Contributing</h2>
<p>
We welcome contributions! Fork the repository and submit a pull request. For major changes, please open an issue to discuss your ideas first.
</p>

<hr>

<h2>License</h2>
<p>
MIT License.
</p>

<hr>

<h2>Contact</h2>
<p>
For support or questions, open an issue or contact the repository owner via GitHub.
</p>
