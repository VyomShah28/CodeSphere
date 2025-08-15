from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("api/google-login/", views.Login, name="Login"),
    path("auth/google/callback/", views.google_callback, name="google_callback"),
    path("api/user-details/", views.user_details, name="User_Details"),
    path("api/create-contest/", views.create_contest, name="Create_Contest"),
    # path("api/challenge-editor/", views.challenge_editor,name="Challenge_Editor"),
    path("api/get-contests/", views.get_contests, name="Get_Contest"),
    path("api/delete-contests/", views.delete_contest_api, name="Delete_Contest"),
    path("api/contest_details/", views.contest_details, name="Contest_Details"),
    path("api/get-challenges/", views.get_challenges, name="Get_Challenges"),
    path(
        "api/get-challenge-by-id/", views.get_challenge_byId, name="Get_Challenge_By_Id"
    ),
    path("api/valid-link/", views.valid_link, name="Valid_Link"),
    path("api/add-challenge/", views.add_challenge, name="add_Challenge"),
    path("api/update-challenge/", views.update_challenge, name="Edit_Challenge"),
    path("api/delete-challenge/", views.delete_challenge, name="Delete_Challenge"),
    path("api/get-contest-by-id/", views.get_contest_byId, name="Get_Contest_By_Id"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
