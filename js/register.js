/**
 * register.js — NexAuth Registration Logic
 * Uses jQuery AJAX only (no form submission)
 */

$(document).ready(function () {

  // ── Password visibility toggle ──
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

  // ── Form validation ──
  function validateForm() {
    const firstName = $('#firstName').val().trim();
    const lastName = $('#lastName').val().trim();
    const email = $('#email').val().trim();
    const username = $('#username').val().trim();
    const password = $('#password').val();
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

    const $btn = $('#submitBtn');
    const $btnText = $('#btnText');

    $btn.prop('disabled', true);
    $btnText.html('<span class="spinner me-2"></span> Creating Account…');

    const formData = {
      first_name: $('#firstName').val().trim(),
      last_name: $('#lastName').val().trim(),
      email: $('#email').val().trim(),
      username: $('#username').val().trim(),
      password: $('#password').val()
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
