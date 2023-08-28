document.addEventListener('DOMContentLoaded', function() {
  const domainList = document.getElementById('user-domains');
  const newDomainInput = document.getElementById('new-domain');
  const addDomainButton = document.getElementById('add-domain');
  const errorBanner = document.getElementById('error-banner');

  // Load saved domains from storage and display them
  chrome.storage.sync.get('userDomains', function(result) {
    const userDomains = result.userDomains || [];
    for (const domain of userDomains) {
      const li = createDomainListItem(domain);
      domainList.appendChild(li);
    }
  });

  // Add a new domain to the list
  addDomainButton.addEventListener('click', async function() {
    const newDomain = newDomainInput.value.trim();
    if (newDomain) {
      const domainRegex = /^(?!www)([-a-zA-Z0-9@:%._\+~#=]+\.)+[a-z]{2,6}$/;

      if (domainRegex.test(newDomain)) {
        const analysis = await analyze(newDomain, false);
        if (analysis >= EnumResult.ProbablyTypo) {
          var userConfirm;
          switch(analysis) {
            case EnumResult.ProbablyTypo: {
              userConfirm = confirm(`TypoAlert has classified ${newDomain} as ProbablyTypo. Are you sure you want to proceed?`);
              break;
            }
            case EnumResult.Typo: {
              userConfirm = confirm(`TypoAlert has classified ${newDomain} as Typo. Are you sure you want to proceed?`);
              break;
            }
            case EnumResult.TypoPhishing: {
              userConfirm = confirm(`TypoAlert has classified ${newDomain} as Typo/Phishing. Are you sure you want to proceed?`);
              break;
            }
          }
          if (!userConfirm) {
            newDomainInput.value = '';
            return;
          }
        }

        errorBanner.textContent = '';
        errorBanner.style.display = 'none';

        const existingDomains = Array.from(domainList.getElementsByTagName('li')).map(li => li.textContent.replace("Remove", ""));
        if (!existingDomains.includes(newDomain)) {
          const li = createDomainListItem(newDomain);
          domainList.appendChild(li);
    
          // Save the updated domain list to storage
          chrome.storage.sync.get('userDomains', function(result) {
            const userDomains = result.userDomains || [];
            userDomains.push(newDomain);
            chrome.storage.sync.set({ userDomains: userDomains });
          });
        } else {
          errorBanner.textContent = 'Domain already exists.';
          errorBanner.style.display = 'block';
        }
      } else {
        errorBanner.textContent = 'Invalid domain format. Please follow the instructions and enter a valid domain name.';
        errorBanner.style.display = 'block';
      }
  
      newDomainInput.value = '';
    }
  });

  newDomainInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      addDomainButton.click();
    }
  });

  // Create a list item for a domain
  function createDomainListItem(domain) {
    const li = document.createElement('li');
    li.textContent = domain;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function() {
      li.remove();

      // Remove the domain from the saved list and update storage
      chrome.storage.sync.get('userDomains', function(result) {
        const userDomains = result.userDomains || [];
        const updatedDomains = userDomains.filter(d => d !== domain);
        chrome.storage.sync.set({ userDomains: updatedDomains });
      });
    });

    li.appendChild(removeButton);
    return li;
  }
});
