from django.contrib import admin
from .models import User, Role, ScamCategory, Post, Comment, Bookmark, Reaction, ContentReport, Media, TargetMedia, Notification, ActivityLog, ReputationHistory

admin.site.register([User, Role, ScamCategory, Post, Comment, Bookmark, Reaction, ContentReport, Media, TargetMedia, Notification, ActivityLog, ReputationHistory])