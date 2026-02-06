(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const sidebarClose = document.getElementById('sidebarClose');
    const main = document.getElementById('main-content');
    const navLinks = Array.from(document.querySelectorAll('.nav-link[data-page]'));

    // Open sidebar function
    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      sidebar.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    // Close sidebar function
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      sidebar.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Event listeners for sidebar open/close
    if (hamburger) hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar(); });

    // Admin SPA loader function
    async function loadAdminSection(page, clickedLink = null, pushUrl = true) {
      page = page || 'dashboard'; // Default to 'dashboard' if no page specified
      try {
        // Fetch the admin partial (Flask route: /admin/<page>)
        const res = await fetch(`/admin/partials/${page}`);
        if (!res.ok) throw new Error('Not found');
        const html = await res.text();
        main.innerHTML = html;
        if (page === "updateevent") {
    initEventsPage();
}
if (page === "updatealumni") {
  initAlumniPage();
}
if (page === "addcertificates") {
  initAddCertificate();
}
if (page === "certificatelayout") {
  initCertificateLayout(); // extra = eventId
}
if (page === "uploadparticipants") {
  initUploadParticipants();
}
if(page==="addcertifiactes"){
  initAddCertificate();
}
if (page === "ourteam") {
  loadAdminTeamList();
}


const heroForm = document.getElementById("heroForm");
if (heroForm) {
  heroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(heroForm);

    const res = await fetch("/admin/update-hero", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    // If embed generated
    if (data.link_type === "embed") {
      const box = document.getElementById("generatedLinkBox");
      const input = document.getElementById("generatedLinkInput");
      box.style.display = "block";
      input.value = `${window.location.origin}${data.generated_link}`;
    }
  });
}

function copyGeneratedLink() {
  const input = document.getElementById("generatedLinkInput");
  if (!input) return;

  // Modern clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(input.value)
      .then(() => alert("Copied to clipboard!"))
      .catch(err => alert("Copy failed: " + err));
  } else {
    // Legacy fallback (for browsers without secure context)
    input.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        alert("Copied to clipboard!");
      } else {
        alert("Copy not permitted, please copy manually.");
      }
    } catch (err) {
      alert("Copy failed, please copy manually");
    }
  }
}



        // Mark active nav items
        navLinks.forEach(l => l.classList.remove('active'));
        if (clickedLink) clickedLink.classList.add('active');

        // Update URL (friendly path)
        if (pushUrl) {
          history.pushState({ page }, '', `/admin/pages/${page}`);
        }

        // Close sidebar on mobile if open
        if (sidebar.classList.contains('open')) closeSidebar();
      } catch (err) {
        main.innerHTML = `<div class="placeholder"><h3>Page Not Found</h3></div>`;
        console.warn(err);
      }
    }

    // Wire nav links (data-page)
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        loadAdminSection(page, link, true);
      });
    });

    // Popstate handling (back/forward buttons)
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || (window.location.pathname.replace('/admin/pages/', '') || 'dashboard');
      loadAdminSection(page, null, false);
    });

    // Initial page — read from URL else default to 'dashboard'
    let initial = window.location.pathname.replace('/admin/pages/', '').replace('/', '');
    if (!initial || initial === '') initial = 'dashboard';
     // Set to 'dashboard' if no page
    loadAdminSection(initial, null, false);
  });
})();

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Parallax on admin-hero and ongoing-event blobs
    const hero = document.querySelector('.admin-page .admin-hero');
    const heroBlobs = document.querySelectorAll('.admin-page .admin-hero .f-blob');
    const overview = document.querySelector('.admin-page .ongoing-event');
    const overviewBlobs = document.querySelectorAll('.admin-page .ongoing-event .f-blob');

    // Parallax effect
    function applyParallax(e, blobs, intensity = 12) {
      if (!blobs || blobs.length === 0) return;
      const rect = (e.currentTarget || e.target).getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      blobs.forEach((b, i) => {
        const depth = (i + 1) * intensity;
        b.style.transform = `translate3d(${cx * depth}px, ${cy * depth}px, 0)`;
      });
    }

    // Hero parallax event listeners
    if (hero && heroBlobs.length) {
      hero.addEventListener('mousemove', e => applyParallax(e, heroBlobs, 8));
      hero.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) applyParallax(e.touches[0], heroBlobs, 8);
      }, { passive: true });
      hero.addEventListener('mouseleave', () => heroBlobs.forEach(b => b.style.transform = 'translate3d(0,0,0)'));
    }

    // Overview parallax event listeners
    if (overview && overviewBlobs.length) {
      overview.addEventListener('mousemove', e => applyParallax(e, overviewBlobs, 6));
      overview.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) applyParallax(e.touches[0], overviewBlobs, 6);
      }, { passive: true });
      overview.addEventListener('mouseleave', () => overviewBlobs.forEach(b => b.style.transform = 'translate3d(0,0,0)'));
    }

    // Fade-in animation for admin page elements
    requestAnimationFrame(() => {
      document.querySelectorAll('.admin-page .stat-card, .admin-page .event-info, .admin-page .announcement').forEach((el, i) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(10px)';
        setTimeout(() => {
          el.style.transition = 'opacity .48s ease, transform .48s cubic-bezier(.2,.9,.2,1)';
          el.style.opacity = 1;
          el.style.transform = 'translateY(0)';
        }, 80 + (i * 80));
      });
    });
  });
})();
function initEventsPage() {
    const main = document.getElementById("main-content");
loadEventsList();
    // -------- Add Event --------
    const addForm = main.querySelector(".add-event-form");
    if (addForm) {
        addForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const formData = new FormData(addForm);

            const res = await fetch("/admin/add-event", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            alert(data.message);
            loadAdminSection("updateevent");
        });
    }

    // -------- Open Edit Modal --------
    main.addEventListener("click", async function (e) {
        if (e.target.classList.contains("btn-update-event")) {
            e.preventDefault();

            const eventId = e.target.dataset.id;

            const res = await fetch(`/admin/get-event/${eventId}`);
            const data = await res.json();

            if (data.status === "success") {
                const ev = data.data;

                main.querySelector("#editEventId").value = eventId;
                main.querySelector("#editTitle").value = ev.title;
                main.querySelector("#editDate").value = ev.date;
                main.querySelector("#editDescription").value = ev.description;
                main.querySelector("#editParticipants").value = ev.participants;

                main.querySelector("#editEventModal").style.display = "block";
            }
        }
    });

    // -------- Close Modal --------
    const closeBtn = main.querySelector("#closeModal");
    if (closeBtn) {
        closeBtn.onclick = () => {
            main.querySelector("#editEventModal").style.display = "none";
        };
    }

    // -------- Update Event --------
    const editForm = main.querySelector("#editEventForm");
    if (editForm) {
        editForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const eventId = main.querySelector("#editEventId").value;
            const formData = new FormData();

            formData.append("title", main.querySelector("#editTitle").value);
            formData.append("date", main.querySelector("#editDate").value);
            formData.append("description", main.querySelector("#editDescription").value);
            formData.append("participants", main.querySelector("#editParticipants").value);

            const file = main.querySelector("#editImage").files[0];
            if (file) {
                formData.append("image", file);
            }

            const res = await fetch(`/admin/update-event/${eventId}`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            alert(data.message);
            loadAdminSection("updateevent");
        });
    }
}
async function loadEventsList() {
    const res = await fetch("/admin/list-events");
    const data = await res.json();

    const container = document.getElementById("eventsContainer");
    container.innerHTML = "";

    data.events.forEach(ev => {
        container.innerHTML += `
            <div class="event-card">
                <h3>${ev.title}</h3>
                <p><strong>Date:</strong> ${ev.date}</p>
                <p>${ev.description}</p>
            </div>
        `;
    });
}
let teamFormSubmitting = false;

document.addEventListener("submit", async (e) => {
  if (!e.target || e.target.id !== "teamMemberForm") return;

  e.preventDefault();

  if (teamFormSubmitting) return; // 🔒 stop double submit
  teamFormSubmitting = true;

  const btn = document.getElementById("saveTeamMemberBtn");
  if (btn) btn.disabled = true;

  const formData = new FormData(e.target);

  try {
    const res = await fetch("/admin/add-team-member", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.status === "success") {
      alert("Team member added successfully");
      e.target.reset();
      loadAdminTeamList();
    } else {
      alert(data.message || "Error");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  } finally {
    teamFormSubmitting = false;
    if (btn) btn.disabled = false;
  }
});
function initAlumniPage() {
  const form = document.querySelector(".alumni-update-form");
  const list = document.getElementById("alumniList");

  if (!form) return;

  // 🔴 STOP PAGE REFRESH
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const alumniId = document.getElementById("alumniId").value;

    const fd = new FormData();
    fd.append("name", alumniName.value.trim());
    fd.append("position", alumniPosition.value.trim());
    fd.append("batch", alumniBatch.value);
    if (alumniPhoto.files[0]) {
      fd.append("photo", alumniPhoto.files[0]);
    }

    const url = alumniId
      ? `/admin/update-alumni/${alumniId}`
      : `/admin/add-alumni`;

    const res = await fetch(url, {
      method: "POST",
      body: fd
    });

    const data = await res.json();
    alert(data.message);

    form.reset();
    document.getElementById("alumniId").value = "";

    loadAlumni();
  });

  async function loadAlumni() {
    const res = await fetch("/admin/list-alumni");
    const data = await res.json();

    list.innerHTML = "";

    data.alumni.forEach(a => {
      list.innerHTML += `
        <div class="alumni-card">
          <img src="${a.image_url || '/static/img/default.png'}">
          <h3>${a.name}</h3>
          <p><b>Batch:</b> ${a.batch}</p>

          <button class="btn-delete" data-id="${a._id}">Delete</button>
        </div>
      `;
    });
  }

  // DELETE
  list.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-delete")) {
      const id = e.target.dataset.id;
      await fetch(`/admin/delete-alumni/${id}`, { method: "DELETE" });
      loadAlumni();
    }

    // UPDATE (prefill)
    if (e.target.classList.contains("btn-update")) {
      const card = e.target.closest(".alumni-card");
      document.getElementById("alumniId").value = e.target.dataset.id;
      alumniName.value = card.querySelector("h3").innerText;
      alumniPosition.value = card.querySelector("p").innerText.replace("Position:", "").trim();
    }
  });

  loadAlumni();
}function initAddCertificate() {
  const form = document.getElementById("certificateEventForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const res = await fetch("/admin/create-certificate-event", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert("Certificate event created successfully!");
      form.reset();
    } else {
      alert(data.error || "Failed to create certificate event");
    }
  });
}
async function loadAdminTeamList() {
  const container = document.querySelector(".members-list");
  if (!container) return;

  container.innerHTML = `<p>Loading members...</p>`;

  try {
    const res = await fetch("/admin/list-team");
    const data = await res.json();

    container.innerHTML = "";

    if (!data.members || !data.members.length) {
      container.innerHTML = "<p>No members found.</p>";
      return;
    }

    data.members.forEach(m => {
      container.innerHTML += `
  <div class="member-card">
    <img src="${m.image_url || '/static/img/default-user.png'}" alt="${m.name}">
    <h3>${m.name}</h3>
    <p><strong>Role:</strong> ${m.role}</p>

    <button onclick="openUpdateTeam('${m._id}')" class="btn-update-member">
  Update
</button>


    <button onclick="deleteTeamMember('${m._id}')" class="btn-delete-member">
      Delete
    </button>
  </div>
`;

    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading members</p>";
  }
}
let currentUpdateType = null; // "team" | "alumni"

async function deleteTeamMember(memberId) {
  if (!confirm("Are you sure you want to delete this member?")) return;

  const res = await fetch(`/admin/delete-team/${memberId}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("Member deleted");
    loadAdminTeamList(); // refresh list
  } else {
    alert("Failed to delete member");
  }
}
async function openUpdateTeam(memberId) {
  const modal = document.getElementById("updateModal");
  modal.style.display = "flex";

  const res = await fetch(`/admin/get-team/${memberId}`);
  const data = await res.json();

  document.getElementById("updateMemberId").value = memberId;
  document.getElementById("updateName").value = data.name || "";
  document.getElementById("updateRole").value = data.role || "";
  document.getElementById("updateCategory").value = data.category || "";
  document.getElementById("updateDepartment").value = data.department || "";
  document.getElementById("updateLinkedin").value = data.linkedin || "";
  document.getElementById("updateInstagram").value = data.instagram || "";
  document.getElementById("updateImagePreview").src =
    data.image_url || "/static/img/default-user.png";
}

function closeUpdateModal() {
  document.getElementById("updateModal").style.display = "none";
}
document.addEventListener("click", e => {
  const modal = document.getElementById("updateModal");
  if (!modal) return;

  // Close only if clicking overlay itself
  if (e.target === modal) {
    closeUpdateModal();
  }
});
document.addEventListener("submit", async function (e) {
  if (e.target.id !== "updateTeamForm") return;

  e.preventDefault();

  const memberId = document.getElementById("updateMemberId").value;

  const payload = {
    name: document.getElementById("updateName").value,
    role: document.getElementById("updateRole").value,
    category: document.getElementById("updateCategory").value,
    department: document.getElementById("updateDepartment").value,
    linkedin: document.getElementById("updateLinkedin").value,
    instagram: document.getElementById("updateInstagram").value
  };

  console.log("SENDING UPDATE:", payload);

  const res = await fetch(`/admin/update-team/${memberId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  console.log("HTTP STATUS:", res.status);

  const data = await res.json();
  console.log("SERVER RESPONSE:", data);

  if (data.status === "success") {
    alert("Updated successfully");
    closeUpdateModal();
    loadAdminTeamList();
  } else {
    alert("Backend rejected update");
  }
});
function withButtonLock(button, asyncHandler) {
  return async function (...args) {
    if (!button || button.disabled) return;

    button.disabled = true;

    const originalText = button.innerText;
    button.innerText = "Please wait...";

    try {
      await asyncHandler(...args);
    } catch (err) {
      console.error(err);
      alert("Request failed");
    } finally {
      button.disabled = false;
      button.innerText = originalText;
    }
  };
}
