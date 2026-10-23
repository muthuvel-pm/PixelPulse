async function search(query) {
  const url = "https://commons.wikimedia.org/w/api.php?action=query" +
    "&generator=search&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json&origin=*";
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image search failed (${response.status})`);
  const data = await response.json();
  return Object.values(data.query?.pages ?? {});
}

function render(items) {
  const results = document.getElementById("results");
  const emptyState = document.getElementById("empty-state");
  const resultCount = document.getElementById("result-count");
  results.replaceChildren();

  items.forEach((item) => {
    const imageUrl = item.imageinfo?.[0]?.thumburl;
    if (!imageUrl) return;

    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = item.title;

    const caption = document.createElement("p");
    caption.textContent = item.title;

    card.appendChild(img);
    card.appendChild(caption);
    results.appendChild(card);
  });

  const count = results.childElementCount;
  emptyState.hidden = count > 0;
  resultCount.textContent = `${count} ${count === 1 ? "result" : "results"}`;
  if (count === 0) {
    document.querySelector(".empty-title").textContent = "No images found.";
    document.querySelector(".empty-description").textContent =
      "Try another topic to discover more visuals.";
  } else {
    document.querySelector(".empty-title").textContent = "Your next discovery awaits.";
    document.querySelector(".empty-description").textContent =
      "Search for a topic above to start exploring. Your images will appear here.";
  }
}

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  try {
    render(await search(query));
  } catch (error) {
    console.error(error);
    document.getElementById("empty-state").hidden = false;
    document.querySelector(".empty-title").textContent = "Search couldn't be completed.";
    document.querySelector(".empty-description").textContent =
      "Please check your connection and try again.";
    document.getElementById("results").replaceChildren();
    document.getElementById("result-count").textContent = "0 results";
  }
});