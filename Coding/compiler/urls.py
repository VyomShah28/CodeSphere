from django.urls import path
from . import views
urlpatterns=[
    path('test1',views.test,name="Test_C"),
    path('start',views.start,name="Start"),
    path('get',views.get,name="Get"),
    path('compile1',views.compile1,name="Compile"),
    path('leaderboard',views.leaderboard,name='Leaderboard'),
    path('time',views.time,name='Time')
]