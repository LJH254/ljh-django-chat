from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect
import time

class CFTMiddleware:
    """拦截非来自cloudflare tunnel的请求"""

    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if not request.headers.get('CF-Connecting-IP'):
            return HttpResponseForbidden("Access denied")
        
        if not request.is_secure():
            return redirect(f"https://{request.get_host()}{request.path}", permanent=True)
        
        return self.get_response(request)
