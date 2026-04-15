(function () {
  function buildButtonMarkup(label) {
    return `
      <span class="send-action-btn__inner">
        <span class="send-action-btn__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" class="icon-svg">
            <path d="M3.75 10 16.5 4.25l-3.5 11.5-3.25-4-4 3 .75-4.5Z" />
          </svg>
        </span>
        <span class="send-action-btn__loader" aria-hidden="true">
          <span class="send-action-btn__spinner">
            <span class="send-action-btn__ring"></span>
            <span class="send-action-btn__streak send-action-btn__streak--1"></span>
            <span class="send-action-btn__streak send-action-btn__streak--2"></span>
            <span class="send-action-btn__streak send-action-btn__streak--3"></span>
            <span class="send-action-btn__streak send-action-btn__streak--4"></span>
            <span class="send-action-btn__streak send-action-btn__streak--5"></span>
            <span class="send-action-btn__streak send-action-btn__streak--6"></span>
            <span class="send-action-btn__streak send-action-btn__streak--7"></span>
            <span class="send-action-btn__streak send-action-btn__streak--8"></span>
          </span>
        </span>
        <span class="send-action-btn__label">${label}</span>
      </span>
    `;
  }

  function createSendFeedback(button) {
    if (!button) return null;
    if (button.__sendFeedbackController) return button.__sendFeedbackController;

    var idleLabel =
      button.dataset.idleLabel ||
      button.textContent.trim() ||
      "Enviar prueba";
    var labelNode = null;
    var resetTimer = null;
    var isLocked = false;
    var lockedLabel = idleLabel;
    var currentState = "idle";

    function clearTimer() {
      if (resetTimer) {
        window.clearTimeout(resetTimer);
        resetTimer = null;
      }
    }

    function ensureMarkup() {
      if (labelNode) return;
      button.classList.add("send-action-btn");
      button.innerHTML = buildButtonMarkup(idleLabel);
      labelNode = button.querySelector(".send-action-btn__label");
    }

    function setState(nextState, label, autoResetMs) {
      ensureMarkup();
      clearTimer();
      currentState = nextState;

      button.classList.remove("is-sending", "is-success", "is-error", "is-blocked");
      button.removeAttribute("aria-busy");

      if (nextState === "sending") {
        button.classList.add("is-sending");
        button.setAttribute("aria-busy", "true");
      } else if (nextState === "success") {
        button.classList.add("is-success");
      } else if (nextState === "error") {
        button.classList.add("is-error");
      }

      if (isLocked && nextState !== "sending") {
        button.classList.add("is-blocked");
      }

      button.disabled = nextState === "sending" || isLocked;
      labelNode.textContent = label || (isLocked ? lockedLabel : idleLabel);

      if (autoResetMs) {
        resetTimer = window.setTimeout(function () {
          controller.reset();
        }, autoResetMs);
      }
    }

    var controller = {
      start: function (label) {
        isLocked = false;
        lockedLabel = idleLabel;
        setState("sending", label || "Enviando");
      },
      success: function (label, autoResetMs) {
        setState("success", label || "Enviado", autoResetMs || 2200);
      },
      error: function (label, autoResetMs) {
        setState("error", label || "Reintentar", autoResetMs || 2600);
      },
      reset: function (label) {
        setState("idle", label || idleLabel);
      },
      lock: function (label) {
        isLocked = true;
        lockedLabel = label || idleLabel;
        setState("idle", lockedLabel);
      },
      unlock: function (label) {
        isLocked = false;
        lockedLabel = idleLabel;
        setState("idle", label || idleLabel);
      },
      setIdleLabel: function (label) {
        if (!label) return;
        idleLabel = label;
        button.dataset.idleLabel = idleLabel;

        if (isLocked) {
          lockedLabel = idleLabel;
        }

        if (currentState === "idle" && labelNode) {
          labelNode.textContent = isLocked ? lockedLabel : idleLabel;
        }
      },
    };

    ensureMarkup();
    button.__sendFeedbackController = controller;
    return controller;
  }

  window.createSendFeedback = createSendFeedback;
})();
