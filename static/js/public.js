document.addEventListener("DOMContentLoaded", () => {
      const main = document.querySelector("#main-content");
      const links = document.querySelectorAll(".nav-link, .sidebar nav a");

      // Admin login handling
      function bindAdminLogin() {
          const form = document.querySelector(".admin-login-form");
          if (!form) {
              console.warn("Admin login form not found.");
              return;
          }

          form.addEventListener("submit", async (e) => {
              e.preventDefault();

              const username = document.getElementById("adminUser").value.trim();
              const password = document.getElementById("adminPass").value.trim();

              if (!username || !password) {
                  alert("Please fill all fields");
                  return;
              }

              try {
                  console.log("Sending fetch to /admin/login...");

                  const res = await fetch("/admin/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username, password })
                  });

                  const data = await res.json();
                  console.log("Response:", data);

                  if (data.status === "success") {
                      window.location.href = data.redirect;
                  } else {
                      alert(data.message);
                  }
              } catch (err) {
                  console.error("Fetch error:", err);
              }
          });
      }

async function loadSection(page, clickedLink = null, pushUrl = true) {
  try {
    if (!page || page === "/" || page === "home") page = "main";

    const res = await fetch(`/partials/${page}`);
    if (!res.ok) throw new Error("Page not found");

    const html = await res.text();
    main.innerHTML = html;

    // ---- PAGE INIT HOOKS ----
    if (page === "events") loadEventsPage();
    if (page === "event-detail") initEventDetailPage();
    if (page === "our-team") initOurTeamPage();
    if (page === "alumni") loadAlumniPublic();
    if (page === "certificates") initCertificatesPage();
    if (page === "admin-login") bindAdminLogin();

    if (page === "main") {
      lastHeroUpdate = null;
    updateHeroSection();
    loadPreviousEvents(); 

      if (typeof initPreviousYearAnimations === "function") {
        initPreviousYearAnimations();
      }
    }

    if (typeof gsap !== "undefined") {
      gsap.from(main, { opacity: 0, y: 20, duration: 0.4 });
    }

    links.forEach(l => l.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");

    if (pushUrl) {
      history.pushState({ page }, "", page === "main" ? "/" : `/pages/${page}`);
    }

  } catch (err) {
    console.error(err);
    main.innerHTML = `
      <section style="padding:60px;text-align:center;">
        <h2>⚠️ Page not found</h2>
        <p>The section you're trying to open doesn't exist.</p>
      </section>`;
  }
}

      // Handle page refresh
      window.addEventListener("popstate", (e) => {
          let page =
  e.state?.page ||
  window.location.pathname.replace("/pages/", "");

if (!page || page === "/" || page === "home") {
  page = "main";
}


    loadSection(page, null, false);
});

loadSection("main");
history.replaceState({ page: "main" }, "", "/");


      links.forEach(link => {
          link.addEventListener("click", e => {
              e.preventDefault();
              let page = e.target.dataset.page ||e.target.textContent.trim().toLowerCase().replace(/['& ]+/g, "-");
              loadSection(page, e.target, true);
              if (typeof closeSidebar === "function") closeSidebar();
          });
      });

      // Initialize gallery animations
      function initGalleryAnimations() {
          const items = document.querySelectorAll(".grid-item");
          items.forEach(item => {
              item.addEventListener("mouseenter", () => {
                  item.classList.add("hovered");
              });
              item.addEventListener("mouseleave", () => {
                  item.classList.remove("hovered");
              });
          });
      }

      // Initialize previous year animations
      function initPreviousYearAnimations() {
          const items = document.querySelectorAll(".grid-item");
          items.forEach(item => {
              item.addEventListener("mouseenter", () => item.classList.add("hovered"));
              item.addEventListener("mouseleave", () => item.classList.remove("hovered"));
          });

          if (typeof gsap !== "undefined") {
              gsap.from(".grid-item", {
                  opacity: 0,
                  y: 30,
                  duration: 0.6,
                  stagger: 0.1,
                  ease: "power2.out"
              });
          }
      }

      gsap.from("footer > *", {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
              trigger: "footer",
              start: "top 90%",
          }
      });

      gsap.utils.toArray('.vam-card').forEach((card, i) => {
          gsap.from(card, {
              scrollTrigger: {
                  trigger: card,
                  start: "top 85%",
                  toggleActions: "play none none reverse"
              },
              y: 40,
              opacity: 0,
              duration: 0.9,
              delay: i * 0.1,
              ease: "power3.out"
          });
      });

      document.getElementById('year').textContent = new Date().getFullYear();

      // Sidebar + hero effects (unchanged)
      const overlay = document.getElementById('overlay');
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      const sidebarClose = document.getElementById('sidebarClose');
      const leftLogo = document.getElementById('leftLogo');
      const rightLogo = document.getElementById('rightLogo');
      const sbLeftLogo = document.getElementById('sbLeftLogo');

      function updateMobileUI() {
          const isMobile = window.innerWidth <= 720;
          const hb = document.getElementById('hamburger');
          if (hb) hb.style.display = isMobile ? 'inline-flex' : 'none';
          if (rightLogo) rightLogo.style.display = isMobile ? 'none' : '';
      }
      updateMobileUI();
      window.addEventListener('resize', updateMobileUI);

      function openSidebar() {
          sidebar.classList.add('open');
          overlay.classList.add('show');
          sidebar.setAttribute('aria-hidden', 'false');
          hamburger.setAttribute('aria-expanded', 'true');
          document.body.style.overflow = 'hidden';
      }

      function closeSidebar() {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
          sidebar.setAttribute('aria-hidden', 'true');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
      }

      if (hamburger) hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
      if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
      overlay.addEventListener('click', closeSidebar);

      document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
      });

      const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  entry.target.classList.add('in-view');
                  obs.unobserve(entry.target);
              }
          });
      }, { threshold: 0.12 });

      document.querySelectorAll('.grid-item, .hero').forEach(el => io.observe(el));

      document.querySelectorAll('.grid-item').forEach(card => {
          const layer = card.querySelector('.ripple-layer');
          card.addEventListener('click', (ev) => {
              const rect = card.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height) * 1.6;
              const ripple = document.createElement('span');

              ripple.style.position = 'absolute';
              ripple.style.borderRadius = '50%';
              ripple.style.pointerEvents = 'none';
              ripple.style.width = ripple.style.height = size + 'px';
              const x = ev.clientX - rect.left - size / 2;
              const y = ev.clientY - rect.top - size / 2;
              ripple.style.left = x + 'px';
              ripple.style.top = y + 'px';
              ripple.style.background = 'radial-gradient(circle at center, rgba(123,97,255,0.28), rgba(74,195,255,0.18) 40%, rgba(74,195,255,0.06) 60%, rgba(255,255,255,0.02) 100%)';
              ripple.style.transform = 'scale(0.2)';
              ripple.style.opacity = '0.95';
              ripple.style.transition = 'transform 600ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease';
              layer.appendChild(ripple);
              requestAnimationFrame(() => {
                  ripple.style.transform = 'scale(1)';
                  ripple.style.opacity = '0';
              });
              setTimeout(() => ripple.remove(), 700);

              card.style.transform = 'translateY(-6px) scale(0.996)';
              setTimeout(() => { card.style.transform = ''; }, 220);
          });

          card.addEventListener('mouseenter', () => card.style.cursor = 'pointer');
      });

      function setLogos(left, right) {
          if (left) { leftLogo.src = left; if (sbLeftLogo) sbLeftLogo.src = left; }
          if (right) rightLogo.src = right;
      }
      window.setLogos = setLogos;

      // Hero section dynamic updates
      let lastHeroUpdate = null;

async function updateHeroSection() {
    const params = lastHeroUpdate ? `?last_update=${lastHeroUpdate}` : "";

    const res = await fetch(`/api/hero-section${params}`);
    const data = await res.json();

    if (data.status === "not_modified") return;

    if (data.updated_at) {
        lastHeroUpdate = data.updated_at;
    }

    if (data.hero_title)
        document.querySelector("#heroTitle").textContent = data.hero_title;

    if (data.btn1_label) {
        const btn1 = document.querySelector("#heroBtn1");
        btn1.textContent = data.btn1_label;
        btn1.href = data.btn1_link;
    }



    if (data.hero_image_url)
        document.querySelector("#heroImage").src = data.hero_image_url;
}

setInterval(() => {
    const currentPage = history.state?.page;
    if (currentPage === "main") {
        updateHeroSection();
    }
}, 5000);


 
  let allEvents = [];

async function loadEventsPage() {
    const grid = document.getElementById("eventsGrid");
    if (!grid) return;

    const res = await fetch("/api/events");
    const data = await res.json();

    grid.innerHTML = "";
    allEvents = data.events || [];

    allEvents.forEach((ev, index) => {
        grid.innerHTML += `
            <div class="event-card">
                <div class="event-image">
                    <img src="${ev.image_url}">
                </div>
                <div class="event-info">
                    <h3>${ev.title}</h3>
                    <p class="date">${ev.date}</p>
                    <a href="/pages/event-detail?index=${index}" 
                        class="btn btn-see-more event-link"
                             data-index="${index}">
                            See More
                        </a>

                </div>
            </div>
        `;
    });
}
document.addEventListener("click", (e) => {
  const link = e.target.closest(".event-link");
  if (!link) return;

  e.preventDefault();

  const index = link.dataset.index;
  const ev = allEvents[index];
  if (!ev) return;

  // store full event object
  sessionStorage.setItem("selectedEvent", JSON.stringify(ev));

  loadSection("event-detail", null, true);
});


// ===== CLEAN MODAL SYSTEM =====
let currentEventIndex = null;

function openEventModal(index) {
  const modal = document.getElementById("eventModal");
  const card  = document.getElementById("eventModalCard");
  const ev    = allEvents[index];
  if (!modal || !ev) return;

  // fill modal data
  document.getElementById("modalImage").src = ev.image_url || "";
  document.getElementById("modalTitle").innerText = ev.title || "";
  document.getElementById("modalDate").innerText = ev.date || "";
  const p = document.getElementById("modalParticipants");
  if (p) p.innerText = ev.participants ? `Participants: ${ev.participants}` : "";
  document.getElementById("modalDescription").innerText = ev.description || "";

  // open with animation
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    modal.classList.add("show");
  });
}

function closeEventModal() {
  const modal = document.getElementById("eventModal");
  if (!modal) return;

  modal.classList.remove("show");
  document.body.style.overflow = "";

  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeEventModal();
  }
});
gsap.registerPlugin(ScrollTrigger);
gsap.from(".event-hero .hero-content", {
  opacity: 0,
  y: 40,
  duration: 1,
  ease: "power3.out"
});
gsap.from(".highlight-card", {
  scrollTrigger: {
    trigger: ".event-highlights",
    start: "top 85%"
  },
  y: 40,
  opacity: 0,
  duration: 0.8,
  stagger: 0.15,
  ease: "power3.out"
});
document.querySelectorAll(".counter").forEach(card => {
  const target = +card.dataset.count;
  const el = card.querySelector("h2");

  ScrollTrigger.create({
    trigger: card,
    start: "top 85%",
    once: true,
    onEnter: () => {
      gsap.fromTo(el, { innerText: 0 }, {
        innerText: target,
        duration: 1.5,
        snap: { innerText: 1 },
        ease: "power1.out"
      });
    }
  });
});
gsap.from(".timeline-item", {
  scrollTrigger: {
    trigger: ".event-timeline",
    start: "top 85%"
  },
  x: -40,
  opacity: 0,
  duration: 0.7,
  stagger: 0.2,
  ease: "power3.out"
});
gsap.utils.toArray(".gallery-item").forEach(item => {
  item.addEventListener("mouseenter", () => {
    gsap.to(item, { scale: 1.05, duration: 0.3 });
  });
  item.addEventListener("mouseleave", () => {
    gsap.to(item, { scale: 1, duration: 0.3 });
  });
});
function initEventDetailPage() {
  const raw = sessionStorage.getItem("selectedEvent");
  if (!raw) return;

  const ev = JSON.parse(raw);

  // Text
  document.getElementById("eventTitle").textContent = ev.title || "";
  document.getElementById("eventDate").textContent = ev.date || "";
  document.getElementById("eventParticipants").textContent =
    ev.participants ?? "-";
  document.getElementById("eventTeams").textContent =
    ev.teams ?? "-";
  document.getElementById("eventDescription").textContent =
    ev.description || "";

  // Hero image
  const hero = document.querySelector(".event-hero");
  if (hero && ev.image_url) {
    hero.style.backgroundImage = `url('${ev.image_url}')`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
  }

  // ===== ANIMATIONS =====
  gsap.from(".event-hero .hero-content", {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: "power3.out"
  });

  gsap.from(".stat-card", {
    opacity: 0,
    y: 40,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.15,
    delay: 0.3,
    ease: "back.out(1.4)"
  });

  gsap.from(".event-description", {
    opacity: 0,
    y: 30,
    duration: 0.8,
    delay: 0.6,
    ease: "power2.out"
  });
}
async function initOurTeamPage() {
  console.log("INIT OUR TEAM PAGE");

  const facultyGrid = document.querySelector(".faculty-grid");
  const coreGrid = document.querySelector(".core-grid");

  if (!facultyGrid && !coreGrid) {
    console.warn("Team grids not found");
    return;
  }

  try {
    const res = await fetch("/api/team", { cache: "no-store" });
    const data = await res.json();

    console.log("TEAM API DATA:", data);

    const members = data.members || [];

    if (facultyGrid) facultyGrid.innerHTML = "";
    if (coreGrid) coreGrid.innerHTML = "";

    members.forEach(m => {

      if (m.category === "faculty" && facultyGrid) {
        facultyGrid.insertAdjacentHTML("beforeend", `
          <div class="faculty-card">
            <div class="faculty-photo">
              <img src="${m.image_url || 'https://www.srit.ac.in/wp-content/uploads/2022/01/csi-logo.png'}">
            </div>
            <h4>${m.name}</h4>
            <p class="designation">
              ${m.role}${m.department ? `, ${m.department}` : ""}
            </p>
          </div>
        `);
      }

      if (m.category === "core" && coreGrid) {
        coreGrid.insertAdjacentHTML("beforeend", `
          <div class="core-card">
            <div class="core-photo">
              <img src="${m.image_url || 'https://www.srit.ac.in/wp-content/uploads/2022/01/csi-logo.png'}">
            </div>
            <h4>${m.name}</h4>
            <p class="role">${m.role}</p>
            <div class="socials">
              ${m.linkedin ? `<a href="${m.linkedin}" target="_blank"><i class="fa-brands fa-linkedin-in"></i></a>` : ""}
              ${m.instagram ? `<a href="${m.instagram}" target="_blank"><i class="fa-brands fa-instagram"></i></a>` : ""}
            </div>
          </div>
        `);
      }

    });

    animateOurTeam(); // ✅ CORRECT FUNCTION

  } catch (err) {
    console.error("Our Team load failed:", err);
  }
}

function animateOurTeam() {
  if (typeof gsap === "undefined") return;

  gsap.from(".team-hero .hero-content", {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: "power3.out"
  });

  gsap.from(".faculty-card, .core-card", {
    scrollTrigger: {
      trigger: ".team-page",
      start: "top 85%"
    },
    opacity: 0,
    y: 30,
    scale: 0.96,
    duration: 0.6,
    stagger: 0.12,
    ease: "power2.out"
  });
}
async function loadAlumniPublic() {
  const grid = document.getElementById("alumniGrid");
  if (!grid) return;

  const res = await fetch("/api/alumni");
  const data = await res.json();

  grid.innerHTML = "";

  data.alumni.forEach(a => {
    grid.innerHTML += `
      <div class="alumni">
        <img src="${a.image_url || 'https://www.srit.ac.in/wp-content/uploads/2022/01/csi-logo.png'}">
        <div class="overlay">
          <h3>${a.name}</h3>
        </div>
      </div>
    `;
  });
}
let currentCertData = null;
// async function initCertificatesPage() {
//   const yearSelect = document.getElementById("certYear");
//   const eventSelect = document.getElementById("certEvent");
//   const nameInput = document.getElementById("certName");
//   const downloadBtn = document.getElementById("downloadCertBtn");

//   if (!yearSelect) return; // safety

//   let certData = {};

//   // 🔹 Load all certificate data
//   const res = await fetch("/certificates/list");
//   certData = await res.json();

//   // 🔹 Populate years
//   yearSelect.innerHTML = `<option value="">Select Year</option>`;
//   Object.keys(certData).sort().reverse().forEach(year => {
//     yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
//   });

//   // 🔹 Year → Events
//   yearSelect.addEventListener("change", () => {
//     const year = yearSelect.value;
//     eventSelect.innerHTML = `<option value="">Select Event</option>`;

//     if (!certData[year]) return;

//     certData[year].forEach(ev => {
//       eventSelect.innerHTML += `
//         <option value="${ev.id}">${ev.name}</option>
//       `;
//     });
//   });

//   // 🔹 Download
//   downloadBtn.addEventListener("click", () => {
//     const eventId = eventSelect.value;
//     const name = nameInput.value.trim();

//     if (!eventId || !name) {
//       alert("Please select year, event and enter your name");
//       return;
//     }

//     const form = document.createElement("form");
//     form.method = "POST";
//     form.action = "/certificate/download";

//     form.innerHTML = `
//       <input type="hidden" name="event_id" value="${eventId}">
//       <input type="hidden" name="name" value="${name}">
//     `;

//     document.body.appendChild(form);
//     form.submit();
//     form.remove();
//   });
// }
function initCertificatesPage() {
  const certYear = document.getElementById("certYear");
  const certEvent = document.getElementById("certEvent");
  const certName = document.getElementById("certName");
  const suggestionsBox = document.getElementById("nameSuggestions");

  const previewBtn = document.getElementById("previewCertBtn");
  const previewSection = document.getElementById("certificatePreviewSection");

  const previewName = document.getElementById("certPreviewName");
  const previewEvent = document.getElementById("certPreviewEvent");
  const previewPosition = document.getElementById("certPreviewPosition");
  const previewYear = document.getElementById("certPreviewYear");

  if (!certYear) return; // SPA safety

  let certData = {};
  let currentNames = [];
  let selectedEventId = null;

  /* -------- LOAD YEARS & EVENTS -------- */
  fetch("/certificates/list")
    .then(res => res.json())
    .then(data => {
      certData = data;
      certYear.innerHTML = `<option value="">Select Year</option>`;

      Object.keys(certData).sort().reverse().forEach(year => {
        certYear.innerHTML += `<option value="${year}">${year}</option>`;
      });
    });

  certYear.addEventListener("change", () => {
    const year = certYear.value;
    certEvent.innerHTML = `<option value="">Select Event</option>`;
    certName.value = "";
    suggestionsBox.innerHTML = "";
    previewSection.style.display = "none";

    if (!certData[year]) return;

    certData[year].forEach(ev => {
      certEvent.innerHTML += `<option value="${ev.id}">${ev.name}</option>`;
    });
  });

  /* -------- LOAD PARTICIPANTS -------- */
  certEvent.addEventListener("change", () => {
    selectedEventId = certEvent.value;
    certName.value = "";
    suggestionsBox.innerHTML = "";
    previewSection.style.display = "none";

    if (!selectedEventId) return;

    fetch(`/certificates/participants/${selectedEventId}`)
      .then(res => res.json())
      .then(names => {
        currentNames = names;
      });
  });

  /* -------- AUTOCOMPLETE -------- */
  certName.addEventListener("input", () => {
    const val = certName.value.toLowerCase();
    suggestionsBox.innerHTML = "";

    if (!val) {
      suggestionsBox.style.display = "none";
      return;
    }

    const matches = currentNames.filter(n =>
      n.toLowerCase().includes(val)
    );

    if (!matches.length) {
      suggestionsBox.style.display = "none";
      return;
    }

    matches.forEach(name => {
      const div = document.createElement("div");
      div.textContent = name;
      div.onclick = () => {
        certName.value = name;
        suggestionsBox.style.display = "none";
      };
      suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = "block";
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete")) {
      suggestionsBox.style.display = "none";
    }
  });

  /* -------- PREVIEW CERTIFICATE -------- */
  previewBtn.addEventListener("click", async () => {
    const year = certYear.value;
    const eventId = certEvent.value;
    const name = certName.value.trim();

    if (!year || !eventId || !name) {
      alert("Please select year, event and name");
      return;
    }

    const res = await fetch("/api/certificate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, name })
    });

    const data = await res.json();

    if (!data.valid) {
      alert(data.message);
      previewSection.style.display = "none";
      return;
    }

    // ---- PERFECT TEXT LOGIC ----
    const position = (data.position || "").toString().toLowerCase();
    const isWinner = ["first", "second", "third", "1", "2", "3"].includes(position);

    previewPosition.innerText = isWinner
      ? "Certificate of Appreciation"
      : "Certificate of Participation";

    previewName.innerText = data.name;
    previewEvent.innerText = certEvent.options[certEvent.selectedIndex].text;
    previewYear.innerText = year;

    previewSection.style.display = "block";
    previewSection.scrollIntoView({ behavior: "smooth" });
    currentCertData = {
  name: data.name,
  year: year,
  eventId: eventId,
  eventName: certEvent.options[certEvent.selectedIndex].text
};

  });
}
// document.getElementById("downloadCertBtn").addEventListener("click", () => {
//   if (!currentCertData) {
//     alert("Preview certificate first");
//     return;
//   }

//   generateQR(currentCertData);
//   downloadPDF();
// });

// function generateQR(data) {
//   const qrContainer = document.getElementById("certQR");
//   qrContainer.innerHTML = "";

//   const verifyUrl =
//     `https://csigriet.in/verify` +
//     `?event=${encodeURIComponent(data.eventId)}` +
//     `&name=${encodeURIComponent(data.name)}` +
//     `&year=${encodeURIComponent(data.year)}`;

//   new QRCode(qrContainer, {
//     text: verifyUrl,
//     width: 90,
//     height: 90,
//     correctLevel: QRCode.CorrectLevel.H
//   });
// }

// function downloadPDF() {
//   const element = document.getElementById("certificatePreview");

//   const opt = {
//     margin: 0,
//     filename: "CSI_Certificate.pdf",
//     image: { type: "jpeg", quality: 1 },
//     html2canvas: {
//       scale: 2,
//       useCORS: true
//     },
//     jsPDF: {
//       unit: "px",
//       format: "a4",
//       orientation: "landscape"
//     }
//   };

//   html2pdf().set(opt).from(element).save();
// }
setTimeout(() => {
  if (!history.state || history.state.page === "main") {
    updateHeroSection();
  }
}, 100);
// 🚫 Disable ALL href="#" default behavior (GLOBAL SPA FIX)
document.addEventListener("click", function (e) {
  const anchor = e.target.closest("a");

  if (!anchor) return;

  const href = anchor.getAttribute("href");

  if (href === "#" || href === "#!") {
    e.preventDefault();
    e.stopPropagation();
  }
});

async function loadPreviousEvents() {
  const grid = document.getElementById("grid2x2");
  if (!grid) return;

  grid.innerHTML = ""; // clear static leftovers

  try {
    const res = await fetch("/api/events/latest", { cache: "no-store" });
    const data = await res.json();

    if (data.status !== "success" || !data.events.length) {
      grid.innerHTML = "<p>No previous events available.</p>";
      return;
    }

    data.events.forEach(ev => {
      grid.insertAdjacentHTML("beforeend", `
        <div class="grid-item" data-title="${ev.title}">
          <div class="ripple-layer"></div>

          <img src="${ev.image_url || '/static/images/event-placeholder.jpg'}"
               alt="${ev.title}">

          <div class="title-bg"></div>
          <div class="title-wrap">
            <span>${ev.title}</span>
          </div>

          <div class="underline"></div>
        </div>
      `);
    });

  } catch (err) {
    console.error("Previous events load failed", err);
  }
}


 });
 /* ===== GLOBAL STATE (REQUIRED) ===== */
let currentCertData = null;
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "downloadCertBtn") {
    redirectToCertificate();
  }
});

function redirectToCertificate() {
  const year = document.getElementById("certYear")?.value;
  const eventSelect = document.getElementById("certEvent");
  const name = document.getElementById("certName")?.value;

  if (!year || !eventSelect?.value || !name) {
    alert("Year, Event and Name are mandatory");
    return;
  }

  const eventName =
    eventSelect.options[eventSelect.selectedIndex].text;
    const eventId = eventSelect.value;
const url =
  `/certificate-template` +
  `?name=${encodeURIComponent(name)}` +
  `&event=${encodeURIComponent(eventName)}` +
  `&year=${encodeURIComponent(year)}`+
  `&event_id=${encodeURIComponent(eventId)}`;

window.open(url, "_blank");
 // NEW TAB (important)
}
