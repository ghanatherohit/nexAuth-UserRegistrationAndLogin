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
    const icon = $(this).find('i');
    if (pwd.attr('type') === 'password') {
      pwd.attr('type', 'text');
      icon.removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
      pwd.attr('type', 'password');
      icon.removeClass('fa-eye-slash').addClass('fa-eye');
    }
  });

  // ── Alert helper ──
  function showAlert(type, message) {
    const box = $('#alertBox');
    box.removeClass('alert-error alert-success alert-info show');
    const iconMap = {
      error: 'fa-circle-exclamation',
      success: 'fa-circle-check',
      info: 'fa-circle-info'
    };
    box.addClass('alert-' + type + ' show')
       .html('<i class="fa-solid ' + iconMap[type] + '"></i> ' + message);
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
          // Store session token in localStorage
          localStorage.setItem('nexauth_token', response.token);
          localStorage.setItem('nexauth_user_id', response.user_id);
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
