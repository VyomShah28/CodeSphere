from django.urls import path
from Test import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns=[
    path('api/google-login/',views.Login,name="Login"),
    path('auth/google/callback/', views.google_callback, name='google_callback'),
    path("api/create-contest/", views.create_contest,name="Create_Contest"),
    # path("api/challenge-editor/", views.challenge_editor,name="Challenge_Editor"),
    path("api/get-contests/", views.get_contests,name="Get_Contest"),
    path("api/delete-contests/", views.delete_contest_api,name="Delete_Contest"),
    path("api/contest_details/", views.contest_details,name="Contest_Details"),
    path('api/get-challenges/',views.get_challenges,name="Get_Challenges"),
    path('api/add-challenge/',views.add_challenge,name="add_Challenge"),
    path('api/update-challenge/',views.update_challenge,name="Edit_Challenge"),
    path('api/delete-challenge/',views.delete_challenge,name="Delete_Challenge"),
    path('api/get-contest-by-id/',views.get_contest_byId,name="Get_Contest_By_Id"),
  
     
     
    # path('test/',views.Test_View,name="Test"),
    # path('details/',views.Details,name="Details"),
    # # path('contest/',views.Contest_View,name='Contest'),
    # path('home/',views.Land,name="Home"),
    # path('delete-challenge/', views.delete_challenge, name='delete_challenge'),
    # path('main',views.Main,name='Main'),
    # path('find_contest',views.find_contest,name='Find_Contest'),
    # path('update',views.update_challenge,name="Update_challenge"),
    # path('get1',views.get_challenge,name="Get_challenge"),
    # path('',views.Home,name='Home1'),
    # path('delete',views.delete_contest,name='delete_contest'),
    # path('enter_contest',views.Enter,name='Enter'),
    # path('response',views.Response,name='Response'),
    # path('track/',views.Track,name='Track')
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)