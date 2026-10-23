async function search(query) {
  const url = "https://commons.wikimedia.org/w/api.php?action=query" +
    "&generator=search&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json&origin=*";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image search failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.info || "The image search service returned an error.");
  }

  return Object.values(data.query?.pages ?? {});
}

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const results = document.getElementById("results");
const emptyState = document.getElementById("empty-state");
const emptyIcon = document.querySelector(".empty-icon");
const emptyTitle = document.querySelector(".empty-title");
const emptyDescription = document.querySelector(".empty-description");
const loadingState = document.getElementById("loading-state");
const resultCount = document.getElementById("result-count");

function showEmptyState(title, description, isError = false) {
  loadingState.hidden = true;
  emptyState.hidden = false;
  emptyState.classList.toggle("is-error", isError);
  emptyIcon.textContent = isError ? "!" : "✳";
  emptyTitle.textContent = title;
  emptyDescription.textContent = description;
}

function render(items) {
  const cards = document.createDocumentFragment();
  let count = 0;

  items.forEach((item) => {
    const imageUrl = item.imageinfo?.[0]?.thumburl;
    if (!imageUrl) return;

    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = item.title;
    img.loading = "lazy";

    const caption = document.createElement("p");
    caption.textContent = item.title;

    card.append(img, caption);
    cards.appendChild(card);
    count += 1;
  });

  results.replaceChildren(cards);
  resultCount.textContent = `${count} ${count === 1 ? "result" : "results"}`;

  if (count === 0) {
    showEmptyState(
      "No images found.",
      "Try a different topic or check the spelling of your search."
    );
    return;
  }

  loadingState.hidden = true;
  emptyState.hidden = true;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }

  results.replaceChildren();
  emptyState.hidden = true;
  loadingState.hidden = false;
  resultCount.textContent = "Searching…";
  searchButton.disabled = true;
  form.setAttribute("aria-busy", "true");

  try {
    render(await search(query));
  } catch (error) {
    console.error("Image search failed:", error);
    results.replaceChildren();
    resultCount.textContent = "0 results";
    showEmptyState(
      "Search couldn't be completed.",
      "We couldn't reach the image search service. Check your connection and try again.",
      true
    );
  } finally {
    searchButton.disabled = false;
    form.removeAttribute("aria-busy");
  }
});

form.addEventListener("reset", () => {
  results.replaceChildren();
  resultCount.textContent = "0 results";
  loadingState.hidden = true;
  emptyState.hidden = false;
  emptyState.classList.remove("is-error");
  emptyIcon.textContent = "✳";
  emptyTitle.textContent = "Your next discovery awaits.";
  emptyDescription.textContent =
    "Search for a topic above to start exploring. Your images will appear here.";
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.textContent.trim();
    form.requestSubmit();
  });
});
