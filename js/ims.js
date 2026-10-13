
/* ===== IMS TARGETS ===== */

let imsRows = [];
let imsHeaders = [];

function loadIMSData(csvText) {
    const rows = parseCSV(csvText);

    if (!rows || rows.length < 2) {
        imsRows = [];
        imsHeaders = [];
        renderIMSTargets();
        return;
    }

    imsHeaders = rows[0].map(value => String(value || "").trim());

    imsRows = rows.slice(1)
        .filter(row => row.some(value => String(value || "").trim() !== ""))
        .map(row => row.map(value => String(value ?? "").trim()));

    renderIMSTargets();
}

function renderIMSTargets() {
    const container = document.getElementById("imsSections");
    const title = document.getElementById("imsHeader");

    if (!container || !title) return;

    if (!imsHeaders.length || !imsRows.length) {
        title.textContent = "IMS Targets";
        container.textContent = "IMS data not available.";
        return;
    }

    const normalise = value =>
        String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const targetIndex = imsHeaders.findIndex(header =>
        normalise(header).includes("target") &&
        !normalise(header).includes("achieved")
    );

    const tillDateIndex = imsHeaders.findIndex(header => {
        const h = normalise(header);
        return h.includes("targetachieved") ||
               h === "tilldate" ||
               h === "tilldatevalue";
    });

    const monthNames = [
        "january", "february", "march", "april",
        "may", "june", "july", "august",
        "september", "october", "november", "december"
    ];

    const monthColumns = imsHeaders.map((header, index) => {
        const h = normalise(header);
        const monthIndex = monthNames.findIndex(month => h.includes(month));

        if (monthIndex < 0) return null;

        return {
            index,
            monthIndex,
            year: (header.match(/20\d{2}/) || [])[0] || ""
        };
    }).filter(Boolean);

    let latestMonth = null;

    monthColumns.forEach(column => {
        const hasData = imsRows.some(row =>
            String(row[column.index] || "").trim() !== ""
        );

        if (hasData) {
            latestMonth = column;
        }
    });

    if (!latestMonth) {
        title.textContent = "IMS Targets";
        container.textContent = "Monthly IMS data not available.";
        return;
    }

    title.textContent =
        "IMS Targets Achieved Till " +
        monthNames[latestMonth.monthIndex].replace(/^./, c => c.toUpperCase()) +
        " " + (latestMonth.year || new Date().getFullYear());

    const objectives = [
        "Production Target",
        "Specific Energy Consumption",
        "Specific Monomer Consumption",
        "Prime Generation",
        "Plant Downtime due to Process Reason",
        "Training Manhours",
        "Near Miss Reporting"
    ];

    container.innerHTML = "";

    objectives.forEach(objective => {
        const row = imsRows.find(r =>
            normalise(r[0]) === normalise(objective)
        );

        if (!row) return;

        const section = document.createElement("div");
        section.className = "ims-section";

        const heading = document.createElement("h4");
        heading.className = "ims-section-title";
        heading.textContent = row[0] || objective;

        const values = document.createElement("div");
        values.className = "ims-values";

        function addValue(label, value) {
            const item = document.createElement("div");
            item.className = "ims-value";

            const labelElement = document.createElement("span");
            labelElement.className = "ims-value-label";
            labelElement.textContent = label;

            const valueElement = document.createElement("span");
            valueElement.className = "ims-value-number";
            valueElement.textContent =
                value !== undefined && value !== "" ? value : "—";

            item.append(labelElement, valueElement);
            values.appendChild(item);
        }

        addValue("Target", targetIndex >= 0 ? row[targetIndex] : "");
        addValue(
            "Last month",
            latestMonth.index >= 0 ? row[latestMonth.index] : ""
        );
        addValue(
            "Till date",
            tillDateIndex >= 0 ? row[tillDateIndex] : ""
        );

        section.append(heading, values);
        container.appendChild(section);
    });
}
