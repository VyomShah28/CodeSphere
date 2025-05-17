from django.urls import path
from Test import views
urlpatterns=[
    path('test/',views.Test_View,name="Test"),
    path('details/',views.Details,name="Details"),
    path('contest/',views.Contest_View,name='Contest'),
    path('home/',views.Land,name="Home"),
    path('delete-challenge/', views.delete_challenge, name='delete_challenge'),
    path('main',views.Main,name='Main'),
    path('login',views.Login,name="Login"),
    path('signup',views.Signup,name='Signup'),
    path('find_contest',views.find_contest,name='Find_Contest'),
    path('check',views.Check,name="Check"),
    path('check_email',views.check_email,name="Check_email"),
    path('update',views.update_challenge,name="Update_challenge"),
    path('get1',views.get_challenge,name="Get_challenge"),
    path('dashboard',views.dashboard,name='Dashboard'),
    path('',views.Home,name='Home1'),
    path('delete',views.delete_contest,name='delete_contest'),
    path('enter_contest',views.Enter,name='Enter'),
    path('response',views.Response,name='Response'),
    path('track/',views.Track,name='Track')
]