document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activityStatus = document.getElementById("activity-status");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createParticipantsSection(activityName, participants) {
    const container = document.createElement("div");
    container.className = "participants";

    const title = document.createElement("strong");
    title.textContent = "Participants:";
    container.appendChild(title);

    const count = document.createElement("p");
    count.className = "participant-count";
    count.textContent = Array.isArray(participants)
      ? `${participants.length} student${participants.length === 1 ? "" : "s"} signed up`
      : "0 students signed up";
    container.appendChild(count);

    if (Array.isArray(participants) && participants.length > 0) {
      const list = document.createElement("div");
      list.className = "participant-list";

      participants.forEach((participant) => {
        const item = document.createElement("div");
        item.className = "participant-item";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = participant;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "delete-participant";
        removeButton.dataset.activity = activityName;
        removeButton.dataset.email = participant;
        removeButton.ariaLabel = `Unregister ${participant}`;
        removeButton.textContent = "×";

        item.appendChild(nameSpan);
        item.appendChild(removeButton);
        list.appendChild(item);
      });

      container.appendChild(list);
    } else {
      const empty = document.createElement("p");
      empty.className = "no-participants";
      empty.innerHTML = "<strong>Participants:</strong> None yet";
      container.appendChild(empty);
    }

    return container;
  }

  function updateActivityCardParticipants(activityName, participant) {
    const cards = Array.from(document.querySelectorAll(".activity-card"));
    const card = cards.find((card) => card.querySelector("h4")?.textContent === activityName);
    if (!card) return;

    const participantsSection = card.querySelector(".participants");
    const countEl = card.querySelector(".participant-count");
    const noParticipants = card.querySelector(".no-participants");

    if (countEl) {
      const currentCount = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = `${currentCount + 1} student${currentCount + 1 === 1 ? "" : "s"} signed up`;
    }

    if (noParticipants) {
      noParticipants.remove();
    }

    let list = card.querySelector(".participant-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "participant-list";
      participantsSection.appendChild(list);
    }

    const item = document.createElement("div");
    item.className = "participant-item";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = participant;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-participant";
    removeButton.dataset.activity = activityName;
    removeButton.dataset.email = participant;
    removeButton.ariaLabel = `Unregister ${participant}`;
    removeButton.textContent = "×";

    item.appendChild(nameSpan);
    item.appendChild(removeButton);
    list.appendChild(item);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity dropdown
      activitiesList.innerHTML = "";
      activityStatus.textContent = "Activities loaded successfully.";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (Array.isArray(details.participants) ? details.participants.length : 0);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(createParticipantsSection(name, details.participants));
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      activityStatus.textContent = "Failed to load activity data.";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle participant unregister click
  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant");
    if (!deleteButton) return;

    const activity = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to unregister participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        updateActivityCardParticipants(activity, email);
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
