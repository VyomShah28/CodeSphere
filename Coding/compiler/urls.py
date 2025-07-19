from django.urls import path
from . import views
urlpatterns=[
    path("api/get_leetcode_problem_description", views.get_leetcode_problem_description, name="Get_Leetcode_Problem_Description"),
    path("api/generate_test_cases", views.get_test_cases, name="Generate_Test_Cases"),
    path("api/runcode",views.run_code,name="Run_Code"),
    
    path('test1',views.test,name="Test_C"),
    path('start',views.start,name="Start"),
    path('get',views.get,name="Get"),
    path('compile1',views.compile1,name="Compile"),
    path('leaderboard',views.leaderboard,name='Leaderboard'),
    path('time',views.time,name='Time'),
    path('submit',views.submit,name='Submit'),
    path('result',views.result,name='Result')
]