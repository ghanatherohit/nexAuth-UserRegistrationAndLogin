/**
 * login.js — NexAuth Login Logic
 * Uses jQuery AJAX, stores session token in localStorage
 */

$(document).ready(function () {

  // Redirect if already logged in
  const existingToken = localStorage.getItem('nexauth_token');
  if (existingToken) {
    window.location.href = 'profile.html';
    return;
  }

  // ── Password toggle ──
  $('#togglePwd').on('click', function () {
    const pwd = $('#password');
    const isPassword = pwd.attr('type') === 'password';
    pwd.attr('type', isPassword ? 'text' : 'password');
    $('#eyeIcon').html(
      isPassword
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
    );
  });

  // ── SVG icons for alerts ──
  const alertIcons = {
    error:   '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    info:    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  // ── Alert helper ──
  function showAlert(type, message) {
    const box = $('#alertBox');
    box.removeClass('alert-error alert-success alert-info show');
    box.addClass('alert-' + type + ' show')
       .html(alertIcons[type] + ' ' + message);
  }

  function hideAlert() {
    $('#alertBox').removeClass('show');
  }

  // ── Form submit ──
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    hideAlert();

    const identifier = $('#identifier').val().trim();
    const password = $('#password').val();

    if (!identifier || !password) {
      showAlert('error', 'Please fill in all fields.');
      return;
    }

    const $btn = $('#submitBtn');
    const $btnText = $('#btnText');
    $btn.prop('disabled', true);
    $btnText.html('<span class="spinner me-2"></span> Signing In…');

    $.ajax({
      url: 'php/login.php',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ identifier: identifier, password: password }),
      dataType: 'json',
      success: function (response) {
        if (response.success) {
          localStorage.setItem('nexauth_token',    response.token);
          localStorage.setItem('nexauth_user_id',  response.user_id);
          localStorage.setItem('nexauth_username', response.username);

          showAlert('success', 'Login successful! Redirecting…');
          setTimeout(function () {
            window.location.href = 'profile.html';
          }, 1200);
        } else {
          showAlert('error', response.message || 'Invalid credentials. Please try again.');
          $btn.prop('disabled', false);
          $btnText.text('Sign In');
        }
      },
      error: function (xhr) {
        let msg = 'Server error. Please try again.';
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.message) msg = res.message;
        } catch (e) {}
        showAlert('error', msg);
        $btn.prop('disabled', false);
        $btnText.text('Sign In');
      }
    });
  });

});