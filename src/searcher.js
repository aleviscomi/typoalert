export async function bingSearch(inputDomain) {
  try {
    const API_KEY = '***';
    var url = `https://api.bing.microsoft.com/v7.0/search?q=${inputDomain}&count=10`;

    var response = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': API_KEY } });
    var data = await response.json();

    // get URLs of results
    var searchResults = data.webPages.value.map(item => {
      let url = new URL(item.displayUrl);
      return url.hostname.replace(/^www\./, '');
    });

    // get DYM
    var dym = data.queryContext.alteredQuery !== undefined ? data.queryContext.alteredQuery : "";

    return { "searchResults" : searchResults, "dym": dym };
  } catch (error) {
    return { "error": error };
  }
}

export async function googleSearch(inputDomain) {
  try {
    var response = await fetch(`https://www.google.com/search?q=${inputDomain}&num=10`);
    var data = await response.text();
    var searchResults = [];

    // get URLs of results
    var divs = data.split(/>(http(s)?:\/\/)/);
    var div, url;
    for (div of divs) {
      if (div !== undefined && !div.includes("doctype")) {
        if (div.includes("cite")) {
          url = div.split("</cite")[0].replace(/^www\./, "").replace(/\/.*/, "");
          if (!url.includes("<") && !url.includes(">") && !searchResults.includes(url)) {
            searchResults.push(url);
          }
        }
        if (div.includes("span")) {
          url = div.split("<span")[0].replace(/^www\./, "").replace(/\/.*/, "");
          if (!url.includes("<") && !url.includes(">") && !searchResults.includes(url)) {
            searchResults.push(url);
          }
        }
      }
    }

    // get DYM
    var dym = "";
    if (data.includes("Forse cercavi:")) {
      dym = data.split(/Forse cercavi:.*?q=/)[1].split("&amp")[0];
    }
    else if (data.includes("Risultati relativi a")) {
      dym = data.split(/Risultati relativi a.*?q=/)[1].split("&amp")[0];
    }
    else if (data.includes("Did you mean:")) {
      dym = data.split(/Did you mean:.*?q=/)[1].split("&amp")[0];
    }
    else if (data.includes("Showing results for")) {
      dym = data.split(/Showing results for.*?q=/)[1].split("&amp")[0];
    }


    return { "searchResults" : searchResults, "dym": dym };
  } catch (error) {
    return { "error": error };
  }
}