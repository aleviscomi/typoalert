chrome.storage.local.get('ctargets', function(result) {
    var ctargets = [];
    var others = [];
    Object.keys(result.ctargets).forEach(ctarget => {
        if (result.ctargets[ctarget] === EnumResult.Typo) {
            ctargets.push(ctarget);
        } else {
            others.push(ctarget);
        }
    });

    const ctargetsList = document.getElementById('ctargets-sites');
    const othersDiv = document.getElementById('others');

    if(ctargetsList) {
        if (ctargets.length > 0) {
            const siteListItems = ctargets.map(site => `<a href="https://${site}" target="_blank">${site}</a>`).join(', ');
            ctargetsList.innerHTML += `${siteListItems}`;
        } else {
            ctargetsList.innerHTML += 'No alternative sites found.';
        }
    }
    if (othersDiv) {
        if (others.length > 0) {
            othersDiv.innerHTML += "<p><b>Others similar domains:</b></p>"
            let table = `<table id="domainTable"> <tr> <th>Domain</th><th>Category</th> </tr> `;

            others.forEach(el => {
                var category = "";
                if (result.ctargets[el] === EnumResult.ProbablyNotTypo) {
                    category = "ProbablyNotTypo";
                } else if (result.ctargets[el] === EnumResult.ProbablyTypo) {
                    category = "ProbablyTypo";
                }
                
                table += `<tr> <td><a href="https://${el}" target="_blank">${el}</a></td> <td>${category}</td> <tr>`;
            });

            table += `</table>`;
            othersDiv.innerHTML += table;
        }
    }
});
  