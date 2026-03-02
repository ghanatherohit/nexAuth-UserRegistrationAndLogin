/**
 * register.js — NexAuth Registration Logic
 * Uses jQuery AJAX only (no form submission)
 */

$(document).ready(function () {

  // ── Password visibility toggle ──
  $('#togglePwd').on('click', function () {
    const pwd = $('#password');
    const isPassword = pwd.attr('type') === 'password';
    pwd.attr('type', isPassword ? 'text' : 'password');
    $('#eyeIconReg').html(
      isPassword
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
    );
  });

  // ── Password strength checker ──
  $('#password').on('input', function () {
    const val = $(this).val();
    const score = getPasswordStrength(val);
    updateStrengthUI(score);
  });

  function getPasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  function updateStrengthUI(score) {
    const segs = ['#s1', '#s2', '#s3', '#s4'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const classes = ['', 'weak', 'fair', 'strong', 'strong'];

    segs.forEach(function (id, i) {
      $(id).removeClass('weak fair strong');
      if (i < score) {
        $(id).addClass(classes[score]);
      }
    });
    $('#strengthLabel').text(score > 0 ? labels[score] + ' password' : 'Enter a password');
  }

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

  // ── Form validation ──
  function validateForm() {
    const firstName       = $('#firstName').val().trim();
    const lastName        = $('#lastName').val().trim();
    const email           = $('#email').val().trim();
    const username        = $('#username').val().trim();
    const password        = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();

    if (!firstName || !lastName) {
      showAlert('error', 'Please enter your full name.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('error', 'Please enter a valid email address.');
      return false;
    }
    if (username.length < 3) {
      showAlert('error', 'Username must be at least 3 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showAlert('error', 'Username can only contain letters, numbers, and underscores.');
      return false;
    }
    if (password.length < 8) {
      showAlert('error', 'Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      showAlert('error', 'Passwords do not match.');
      return false;
    }
    return true;
  }

  // ── Submit handler ──
  $('#registerForm').on('submit', function (e) {
    e.preventDefault();
    hideAlert();

    if (!validateForm()) return;

    const $btn     = $('#submitBtn');
    const $btnText = $('#btnText');

    $btn.prop('disabled', true);
    $btnText.html('<span class="spinner me-2"></span> Creating Account…');

    const formData = {
      first_name: $('#firstName').val().trim(),
      last_name:  $('#lastName').val().trim(),
      email:      $('#email').val().trim(),
      username:   $('#username').val().trim(),
      password:   $('#password').val()
    };

    $.ajax({
      url: 'php/register.php',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(formData),
      dataType: 'json',
      success: function (response) {
        if (response.success) {
          showAlert('success', 'Account created! Redirecting to login…');
          setTimeout(function () {
            window.location.href = 'login.html';
          }, 1800);
        } else {
          showAlert('error', response.message || 'Registration failed. Please try again.');
          $btn.prop('disabled', false);
          $btnText.text('Create Account');
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
        $btnText.text('Create Account');
      }
    });
  });

});