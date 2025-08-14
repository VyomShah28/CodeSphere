from django.urls import path
from . import views
urlpatterns=[
    path("api/get_leetcode_problem_description", views.get_leetcode_problem_description, name="Get_Leetcode_Problem_Description"),
    path("api/generate_test_cases", views.get_test_cases_master, name="Generate_Test_Cases"),
    path("api/runcode",views.run_code_master,name="Run_Code"),
    path("api/submitContest", views.submit_code_master, name="Submit_Contest"),
    path("api/userProgress", views.get_user_progress, name="Progress"),
    path("api/getLeaderboard", views.leaderboard, name="Get_Leaderboard"),
]