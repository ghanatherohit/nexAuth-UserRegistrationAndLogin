/**
 * profile.js — NexAuth Profile Logic
 * Loads profile data from MongoDB via PHP, supports edit/update
 */

$(document).ready(function () {

  // ── Auth Guard: check localStorage token ──
  const token    = localStorage.getItem('nexauth_token');
  const userId   = localStorage.getItem('nexauth_user_id');
  const username = localStorage.getItem('nexauth_username');

  if (!token || !userId) {
    window.location.href = 'login.html';
    return;
  }

  // ── Set nav username (SVG dot — no inline style) ──
  $('#navUsername').prepend(
    '<svg class="online-dot" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="#68d391"><circle cx="12" cy="12" r="10"></circle></svg> ' +
    (username || 'User') + ' &nbsp;'
  );

  // ── SVG icons for alerts ──
  const alertIcons = {
    error:   '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    info:    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  // ── Alert helpers ──
  function showAlert(type, msg, target) {
    target = target || '#globalAlert';
    const box = $(target);
    box.removeClass('alert-error alert-success alert-info show');
    box.addClass('alert-' + type + ' show')
       .html(alertIcons[type] + ' ' + msg);
    setTimeout(function () { box.removeClass('show'); }, 4000);
  }

  // ── Calculate age from DOB ──
  function calculateAge(dob) {
    if (!dob) return '—';
    const birthDate = new Date(dob);
    const today     = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age + ' years';
  }

  // ── Format date for display ──
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── Render profile view ──
  function renderProfile(data) {
    const fullName = (data.first_name || '') + ' ' + (data.last_name || '');
    const initials = ((data.first_name || '?')[0] + (data.last_name || '?')[0]).toUpperCase();

    $('#avatarCircle').text(initials);
    $('#profileName').text(fullName.trim() || 'No Name');
    $('#profileUsername').text('@' + (data.username || '—'));
    $('#profileEmail').text(data.email || '—');
    $('#view-joined').text(formatDate(data.created_at));
    $('#view-role').text(data.role || 'Member');

    const profile = data.profile || {};
    $('#view-dob').text(formatDate(profile.dob) || '—');
    $('#view-age').text(profile.dob ? calculateAge(profile.dob) : '—');
    $('#view-gender').text(profile.gender || '—');
    $('#view-contact').text(profile.contact || '—');
    $('#view-city').text(profile.city || '—');
    $('#view-country').text(profile.country || '—');
    $('#view-occupation').text(profile.occupation || '—');
    $('#view-bio').text(profile.bio || '—');

    // Pre-fill edit fields
    if (profile.dob) $('#edit-dob').val(profile.dob.substring(0, 10));
    $('#edit-gender').val(profile.gender || '');
    $('#edit-contact').val(profile.contact || '');
    $('#edit-city').val(profile.city || '');
    $('#edit-country').val(profile.country || '');
    $('#edit-occupation').val(profile.occupation || '');
    $('#edit-bio').val(profile.bio || '');
  }

  // ── Load profile data ──
  function loadProfile() {
    $.ajax({
      url: 'php/profile.php',
      method: 'GET',
      headers: { 'X-Auth-Token': token, 'X-User-Id': userId },
      dataType: 'json',
      success: function (response) {
        if (response.success) {
          renderProfile(response.data);
        } else if (response.auth_error) {
          localStorage.clear();
          window.location.href = 'login.html';
        } else {
          showAlert('info', 'Profile not fully set up yet. Fill in your details!');
          if (response.data) renderProfile(response.data);
        }
      },
      error: function () {
        showAlert('error', 'Failed to load profile. Please refresh.');
      }
    });
  }

  loadProfile();

  // ── Edit / Cancel Toggle ──
  $('#editBtn').on('click', function () {
    $('#viewMode, #viewMode2').hide();
    $('#editMode, #editMode2').show();
    $('#editBtn').hide();
    $('#saveBtn, #cancelBtn').show();
  });

  $('#cancelBtn').on('click', function () {
    $('#viewMode, #viewMode2').show();
    $('#editMode, #editMode2').hide();
    $('#editBtn').show();
    $('#saveBtn, #cancelBtn').hide();
  });

  // ── Save profile ──
  $('#saveBtn').on('click', function () {
    const $btn     = $(this);
    const $btnText = $('#saveBtnText');
    $btn.prop('disabled', true);
    $btnText.html('<span class="spinner me-2"></span>');

    const profileData = {
      dob:        $('#edit-dob').val(),
      gender:     $('#edit-gender').val(),
      contact:    $('#edit-contact').val().trim(),
      city:       $('#edit-city').val().trim(),
      country:    $('#edit-country').val().trim(),
      occupation: $('#edit-occupation').val().trim(),
      bio:        $('#edit-bio').val().trim()
    };

    $.ajax({
      url: 'php/profile.php',
      method: 'POST',
      contentType: 'application/json',
      headers: { 'X-Auth-Token': token, 'X-User-Id': userId },
      data: JSON.stringify(profileData),
      dataType: 'json',
      success: function (response) {
        if (response.success) {
          showAlert('success', 'Profile updated successfully!', '#alertBox');
          loadProfile();
          $('#cancelBtn').trigger('click');
        } else {
          showAlert('error', response.message || 'Update failed.', '#alertBox');
        }
        $btn.prop('disabled', false);
        $btnText.text('Save Changes');
      },
      error: function () {
        showAlert('error', 'Server error while saving.', '#alertBox');
        $btn.prop('disabled', false);
        $btnText.text('Save Changes');
      }
    });
  });

  // ── Logout ──
  $('#logoutBtn').on('click', function () {
    $.ajax({
      url: 'php/login.php',
      method: 'DELETE',
      contentType: 'application/json',
      headers: { 'X-Auth-Token': token, 'X-User-Id': userId },
      dataType: 'json',
      complete: function () {
        localStorage.removeItem('nexauth_token');
        localStorage.removeItem('nexauth_user_id');
        localStorage.removeItem('nexauth_username');
        window.location.href = 'login.html';
      }
    });
  });

});