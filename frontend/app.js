const API_URL = "http://127.0.0.1:8000";

let donutChart = null;
let trendChart = null;


// ==========================================
// ANALYZE REVIEW
// ==========================================

document.getElementById("analyze").addEventListener("click", analyzeReview);

async function analyzeReview() {

    const review = document.getElementById("review").value.trim();
    const service = document.getElementById("service").value;

    document.getElementById("resultService").textContent = service;

    if (!review) {
        alert("Please enter a customer review.");
        return;
    }
    const analyzeButton =
    document.getElementById("analyze");

analyzeButton.disabled = true;

analyzeButton.textContent = "⏳ Analyzing...";

    try {

        const response = await fetch(`${API_URL}/api/predict`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: review,
                service: service
            })
        });
    if (!response.ok) {

        const errorData =
            await response.json();

        throw new Error(
            errorData.detail ||
            "Prediction API failed"
        );
    }

        const result = await response.json();

        console.log("AI Prediction:", result);

        document.getElementById("sentiment").textContent =
            result.sentiment;
            const resultBox =
    document.getElementById("result");

const resultFace =
    document.querySelector(".face");

const resultMessage =
    document.getElementById("message");

if (result.sentiment === "Positive") {

    resultBox.style.background = "#ecfdf3";
    resultBox.style.borderColor = "#b7ebcc";

    resultFace.style.background = "#43bd7c";
    resultFace.style.color = "white";

    resultMessage.style.background = "#d9f7e5";
    resultMessage.style.color = "#166534";

}
else if (result.sentiment === "Neutral") {

    resultBox.style.background = "#fff9e6";
    resultBox.style.borderColor = "#f3d98b";

    resultFace.style.background = "#f2c94c";
    resultFace.style.color = "white";

    resultMessage.style.background = "#fff1bd";
    resultMessage.style.color = "#8a6500";

}
else if (result.sentiment === "Negative") {

    resultBox.style.background = "#fff0f0";
    resultBox.style.borderColor = "#f2b8b8";

    resultFace.style.background = "#e74b52";
    resultFace.style.color = "white";

    resultMessage.style.background = "#ffdada";
    resultMessage.style.color = "#991b1b";

}

        document.getElementById("confidence").textContent =
            Number(result.confidence).toFixed(1) + "%";
        document.getElementById("confidenceValue").textContent =
            Number(result.confidence).toFixed(1) + "%";

        document.getElementById("confidenceBar").style.width =
            Number(result.confidence) + "%";
            // ==========================================
// DYNAMIC SENTIMENT & CONFIDENCE COLORS
// ==========================================

const sentimentText =
    document.getElementById("sentiment");

const confidenceBar =
    document.getElementById("confidenceBar");

const confidenceValue =
    Number(result.confidence);


// ------------------------------------------
// SENTIMENT TEXT COLOR
// ------------------------------------------

if (result.sentiment === "Positive") {

    sentimentText.style.color = "#159447";

}
else if (result.sentiment === "Neutral") {

    sentimentText.style.color = "#c28a00";

}
else if (result.sentiment === "Negative") {

    sentimentText.style.color = "#e53935";

}


// ------------------------------------------
// CONFIDENCE BAR COLOR
// ------------------------------------------

if (confidenceValue >= 85) {

    confidenceBar.style.background = "#159447";

}
else if (confidenceValue >= 80) {

    confidenceBar.style.background = "#f2c94c";

}
else {

    confidenceBar.style.background = "#e53935";

}

        document.getElementById("message").textContent =
            result.message;

        loadDashboard();
        loadReviews();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
    finally {

    analyzeButton.disabled = false;

    analyzeButton.textContent = "➤ Analyze Review";
}
}


// ==========================================
// CLEAR BUTTON
// ==========================================

document.getElementById("clear").addEventListener("click", function () {

    document.getElementById("review").value = "";

    document.getElementById("counter").textContent = "0";

    document.getElementById("sentiment").textContent = "—";

    document.getElementById("confidence").textContent = "—";

    document.getElementById("confidenceValue").textContent = "0%";

    document.getElementById("confidenceBar").style.width = "0%";
    
    document.getElementById("sentiment").style.color = "#159447";
    document.getElementById("confidenceBar").style.background = "#159447";

    document.getElementById("message").textContent =
        "Analyze a review to see the result.";
});


// ==========================================
// CHARACTER COUNTER
// ==========================================

document.getElementById("review").addEventListener("input", function () {

    document.getElementById("counter").textContent =
        this.value.length;

});


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const response =
            await fetch(`${API_URL}/api/summary`);

        if (!response.ok) {
            throw new Error("Summary API failed");
        }

        const data = await response.json();

        console.log("Dashboard Data:", data);

        updateKPIs(data);

        updateCharts(data);

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }
}


// ==========================================
// UPDATE KPI CARDS
// ==========================================

function updateKPIs(data) {

    const total = data.total || 0;
    const positive = data.positive || 0;
    const neutral = data.neutral || 0;
    const negative = data.negative || 0;

    document.getElementById("total").textContent =
        total;

    if (total > 0) {

        document.getElementById("positive").textContent =
            Math.round((positive / total) * 100) + "%";

        document.getElementById("neutral").textContent =
            Math.round((neutral / total) * 100) + "%";

        document.getElementById("negative").textContent =
            Math.round((negative / total) * 100) + "%";

    } else {

        document.getElementById("positive").textContent = "0%";
        document.getElementById("neutral").textContent = "0%";
        document.getElementById("negative").textContent = "0%";
    }
}


// ==========================================
// CHARTS
// ==========================================

function updateCharts(data) {

    const positive = data.positive || 0;
    const neutral = data.neutral || 0;
    const negative = data.negative || 0;


    // ======================================
    // SENTIMENT DONUT
    // ======================================

    const donutCanvas =
        document.getElementById("donut");

    if (donutCanvas) {

        if (donutChart) {
            donutChart.destroy();
        }

        donutChart = new Chart(donutCanvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Positive",
                    "Neutral",
                    "Negative"
                ],

                datasets: [{
                    data: [
                        positive,
                        neutral,
                        negative
                    ]
                }]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }
            }
        });
    }


    // ======================================
    // SERVICE-WISE SENTIMENT
    // ======================================

    const servicesContainer =
        document.getElementById("services");

    if (servicesContainer) {

        const services =
            data.services || [];

        servicesContainer.innerHTML = "";

        if (services.length === 0) {

            servicesContainer.innerHTML =
                "<p>No service data available.</p>";

        } else {

            services.forEach(function(item) {

                const row =
                    document.createElement("div");

                const score =
                    Number(item.score) || 0;

                row.style.marginBottom = "20px";


                row.innerHTML = `

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:7px;
                        font-size:15px;
                    ">

                        <span style="
                            font-weight:600;
                            color:#17365d;
                        ">
                            ${escapeHTML(item.service)}
                        </span>

                        <strong style="
                            color:#17365d;
                        ">
                            ${score}%
                        </strong>

                    </div>


                    <div style="
                        width:100%;
                        height:10px;
                        background:#e7edf4;
                        border-radius:10px;
                        overflow:hidden;
                    ">

                        <div style="
                            width:${score}%;
                            height:100%;
                            background:#ff4653;
                            border-radius:10px;
                        "></div>

                    </div>


                    <div style="
                        margin-top:6px;
                        font-size:12px;
                        color:#718096;
                    ">
                        ${item.n} reviews
                    </div>

                `;

                servicesContainer.appendChild(row);

            });
        }
    }


    // ======================================
    // MONTHLY SENTIMENT TREND
    // ======================================

    const trendCanvas =
        document.getElementById("trend");

    if (trendCanvas) {

        if (trendChart) {
            trendChart.destroy();
        }

        const monthly =
            data.monthly || [];


        const labels =
            monthly.map(function(item) {

                return item.month;

            });


        const positiveData =
            monthly.map(function(item) {

                return item.positive;

            });


        const neutralData =
            monthly.map(function(item) {

                return item.neutral;

            });


        const negativeData =
            monthly.map(function(item) {

                return item.negative;

            });


        trendChart = new Chart(trendCanvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Positive",
                        data: positiveData,
                        tension: 0.3
                    },

                    {
                        label: "Neutral",
                        data: neutralData,
                        tension: 0.3
                    },

                    {
                        label: "Negative",
                        data: negativeData,
                        tension: 0.3
                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                },

                scales: {

                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }

                }

            }

        });

    }

}


// ==========================================
// LOAD RECENT REVIEWS
// ==========================================

async function loadReviews() {

    try {

        const response =
            await fetch(`${API_URL}/api/reviews`);

        if (!response.ok) {
            throw new Error("Reviews API failed");
        }

        const reviews =
            await response.json();

        displayReviews(reviews);

    } catch (error) {

        console.error(
            "Reviews loading error:",
            error
        );

    }
}


// ==========================================
// DISPLAY RECENT REVIEWS
// ==========================================

function displayReviews(reviews) {

    const container =
        document.getElementById("recent");

    if (!container) return;


    if (!reviews || reviews.length === 0) {

        container.innerHTML =
            "<p>No reviews available.</p>";

        return;
    }


    container.innerHTML = "";


    reviews.slice(0, 5).forEach(function(review) {

        const item =
            document.createElement("div");

        item.className =
            "recent-review";

            item.style.padding = "10px 0";
            item.style.borderBottom = "1px solid #edf1f5";


        item.innerHTML = `

            <p>
                ${escapeHTML(review.text)}
            </p>

            <small>

                ${escapeHTML(review.service)}

                • 

                <span style="
    padding:3px 9px;
    border-radius:12px;
    font-size:11px;
    font-weight:600;
    background:${
        review.sentiment === "Positive"
            ? "#e6f7ed"
            : review.sentiment === "Neutral"
            ? "#fff6d8"
            : "#fde8e8"
    };
    color:${
        review.sentiment === "Positive"
            ? "#159447"
            : review.sentiment === "Neutral"
            ? "#c28a00"
            : "#e53935"
    };
">
    ${escapeHTML(review.sentiment)}
</span>

                •

                ${Number(review.confidence).toFixed(1)}%

            </small>

        `;


        container.appendChild(item);

    });

}


// ==========================================
// SECURITY HELPER
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Bank Muscat Sentiment Analyzer loaded"
        );

        loadDashboard();

        loadReviews();

    }
);
// ==========================================
// REVIEW HISTORY
// ==========================================

const historyPage =
    document.getElementById("historyPage");


// ------------------------------------------
// NAVIGATION
// ------------------------------------------

document.querySelectorAll("nav button").forEach(function(button) {

    button.addEventListener("click", function() {

        const page =
            this.getAttribute("data-page");


        // Remove active from all buttons

        document.querySelectorAll("nav button")
            .forEach(function(btn) {
                btn.classList.remove("active");
            });


        // Add active to clicked button

        this.classList.add("active");


       // Dashboard

if (page === "dashboard") {

    showDashboard();

    return;
}


// Analyze Review

if (page === "analyze") {

    showAnalyze();

    return;
}


        // Review History

        if (page === "history") {

            showHistory();

            loadHistory();

            return;
        }


        // Other pages - coming next

       if (page === "analytics") {

    showAnalytics();

    loadAnalytics();

    return;
}


if (page === "data") {
    showDataManagement();
    loadDataManagement();
    return;
}

if (page === "about") {
    showAbout();
    return;
}
    });

});


// ------------------------------------------
// SHOW DASHBOARD
// ------------------------------------------

function showDashboard() {

    if (historyPage) {
        historyPage.style.display = "none";
    }

    const analyticsPage =
        document.getElementById("analyticsPage");

    if (analyticsPage) {
        analyticsPage.style.display = "none";
    }

    const dataPage =
        document.getElementById("dataPage");

    if (dataPage) {
        dataPage.style.display = "none";
    }

    const aboutPage =
        document.getElementById("aboutPage");

    if (aboutPage) {
        aboutPage.style.display = "none";
    }

    document.querySelector(".analyzer").style.display =
        "grid";

    document.querySelector(".kpis").style.display =
        "grid";

    document.querySelector(".charts").style.display =
        "grid";

    document.querySelector(".bottom").style.display =
        "grid";
}
// ------------------------------------------
// SHOW ANALYZE REVIEW
// ------------------------------------------

function showAnalyze() {

    document.querySelector(".kpis").style.display = "none";

    document.querySelector(".charts").style.display = "none";

    document.querySelector(".bottom").style.display = "none";


    if (historyPage) {
        historyPage.style.display = "none";
    }

    const analyticsPage =
        document.getElementById("analyticsPage");

    if (analyticsPage) {
        analyticsPage.style.display = "none";
    }

    const dataPage =
        document.getElementById("dataPage");

    if (dataPage) {
        dataPage.style.display = "none";
    }

    const aboutPage =
        document.getElementById("aboutPage");

    if (aboutPage) {
        aboutPage.style.display = "none";
    }


    const analyzer =
        document.querySelector(".analyzer");

    if (analyzer) {

        analyzer.style.display = "grid";

        analyzer.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}

// ------------------------------------------
// SHOW HISTORY
// ------------------------------------------

function showHistory() {

    document.querySelector(".analyzer").style.display =
        "none";

    document.querySelector(".kpis").style.display =
        "none";

    document.querySelector(".charts").style.display =
        "none";

    document.querySelector(".bottom").style.display =
        "none";


    if (historyPage) {
        historyPage.style.display = "block";
    }

}
// ==========================================
// SHOW ANALYTICS
// ==========================================

function showAnalytics() {

    document.querySelector(".analyzer").style.display = "none";

    document.querySelector("main > .kpis").style.display = "none";

    document.querySelector("main > .charts").style.display = "none";

    document.querySelector("main > .bottom").style.display = "none";

    if (historyPage) {
        historyPage.style.display = "none";
    }

    const analyticsPage =
        document.getElementById("analyticsPage");

    if (analyticsPage) {
        analyticsPage.style.display = "block";
    }

}
function showDataManagement() {

    document.querySelector(".analyzer").style.display = "none";
    document.querySelector("main > .kpis").style.display = "none";
    document.querySelector("main > .charts").style.display = "none";
    document.querySelector("main > .bottom").style.display = "none";

    if (historyPage) {
        historyPage.style.display = "none";
    }

    const analyticsPage = document.getElementById("analyticsPage");
    if (analyticsPage) {
        analyticsPage.style.display = "none";
    }

    const dataPage = document.getElementById("dataPage");

    if (dataPage) {
        dataPage.style.display = "block";
    }
}
async function loadDataManagement() {

    try {

        const response =
            await fetch(`${API_URL}/api/analytics`);

        if (!response.ok) {
            throw new Error("Analytics API failed");
        }

        const data =
            await response.json();

        console.log("Data Management Data:", data);

        // Total records
        const total =
            data.total_reviews || 0;

        // Services
        const services =
            Array.isArray(data.services)
                ? data.services.length
                : 0;

        // Update cards
        document.getElementById("dataTotal").textContent =
            total;

        document.getElementById("dataTextReviews").textContent =
            total;

        document.getElementById("dataServices").textContent =
            services;

        document.getElementById("dataAnalyzed").textContent =
            total;

    } catch (error) {

        console.error(
            "Data Management Error:",
            error
        );

    }
}

function showAbout() {

    document.querySelector(".analyzer").style.display = "none";
    document.querySelector("main > .kpis").style.display = "none";
    document.querySelector("main > .charts").style.display = "none";
    document.querySelector("main > .bottom").style.display = "none";

    if (historyPage) {
        historyPage.style.display = "none";
    }

    const analyticsPage = document.getElementById("analyticsPage");

    if (analyticsPage) {
        analyticsPage.style.display = "none";
    }

    const dataPage = document.getElementById("dataPage");

    if (dataPage) {
        dataPage.style.display = "none";
    }

    const aboutPage = document.getElementById("aboutPage");

    if (aboutPage) {
        aboutPage.style.display = "block";
        aboutPage.scrollTop = 0;
    }
}


// ==========================================
// LOAD ANALYTICS DATA
// ==========================================

async function loadAnalytics() {

    try {

        const response =
            await fetch(`${API_URL}/api/analytics`);

        if (!response.ok) {
            throw new Error("Analytics API failed");
        }

        const data =
            await response.json();

        console.log(
            "Analytics Data:",
            data
        );

        displayAnalytics(data);

    } catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );

    }

}


// ==========================================
// DISPLAY ANALYTICS
// ==========================================

function displayAnalytics(data) {

    // KPI
    document.getElementById("analyticsTotal").textContent =
        data.total_reviews || 0;

    document.getElementById("analyticsPositive").textContent =
        (data.sentiment?.positive_percentage || 0) + "%";

    document.getElementById("analyticsNegative").textContent =
        (data.sentiment?.negative_percentage || 0) + "%";

    document.getElementById("analyticsConfidence").textContent =
        (data.average_confidence || 0) + "%";


    // BEST SERVICE
    const best = data.best_service;

    if (best) {

        document.getElementById("bestService").textContent =
            best.service;

        document.getElementById("bestServiceDetails").textContent =
            `${best.score}% sentiment score • ${best.reviews} reviews • ${best.confidence}% confidence`;
    }


    // WORST SERVICE
    const worst = data.worst_service;

    if (worst) {

        document.getElementById("worstService").textContent =
            worst.service;

        document.getElementById("worstServiceDetails").textContent =
            `${worst.score}% sentiment score • ${worst.reviews} reviews • ${worst.confidence}% confidence`;
    }


    // BUSINESS INSIGHTS
    const insightsList =
        document.getElementById("insightsList");

    if (insightsList) {

        insightsList.innerHTML = "";

        const insights = data.insights || [];

        insights.forEach(function(insight) {

            const item =
                document.createElement("div");

            item.style.padding = "14px 16px";
            item.style.marginBottom = "10px";
            item.style.background = "#f4f8fc";
            item.style.borderRadius = "8px";
            item.style.borderLeft = "4px solid #f4434d";

            item.textContent = insight;

            insightsList.appendChild(item);

        });
    }


    // SERVICE PERFORMANCE TABLE
    const serviceContainer =
        document.getElementById("analyticsServices");

    if (serviceContainer) {

        const services = data.services || [];

        if (services.length === 0) {

            serviceContainer.innerHTML =
                "<p style='color:#718096;'>No service data available.</p>";

        } else {

            let html = `
                <div style="overflow-x:auto;">

                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        font-size:14px;
                    ">

                        <thead>

                            <tr style="
                                background:#f4f7fb;
                                text-align:left;
                            ">

                                <th style="padding:14px 12px;">
                                    Service
                                </th>

                                <th style="padding:14px 12px;">
                                    Reviews
                                </th>

                                <th style="padding:14px 12px;">
                                    Positive
                                </th>

                                <th style="padding:14px 12px;">
                                    Neutral
                                </th>

                                <th style="padding:14px 12px;">
                                    Negative
                                </th>

                                <th style="padding:14px 12px;">
                                    Score
                                </th>

                                <th style="padding:14px 12px;">
                                    Confidence
                                </th>

                            </tr>

                        </thead>

                        <tbody>
            `;


            services.forEach(function(service) {

                html += `
                    <tr style="
                        border-top:1px solid #edf1f5;
                    ">

                        <td style="
                            padding:14px 12px;
                            font-weight:700;
                            color:#17365d;
                        ">
                            ${escapeHTML(service.service)}
                        </td>

                        <td style="padding:14px 12px;">
                            ${service.reviews}
                        </td>

                        <td style="
                            padding:14px 12px;
                            color:#1b914a;
                            font-weight:700;
                        ">
                            ${service.positive_percentage}%
                        </td>

                        <td style="
                            padding:14px 12px;
                            color:#718096;
                            font-weight:700;
                        ">
                            ${service.neutral_percentage}%
                        </td>

                        <td style="
                            padding:14px 12px;
                            color:#e74b52;
                            font-weight:700;
                        ">
                            ${service.negative_percentage}%
                        </td>

                        <td style="
                            padding:14px 12px;
                            font-weight:800;
                        ">
                            ${service.score}%
                        </td>

                        <td style="padding:14px 12px;">
                            ${service.confidence}%
                        </td>

                    </tr>
                `;

            });


            html += `
                        </tbody>

                    </table>

                </div>
            `;


            serviceContainer.innerHTML = html;

        }
    }

}
// ------------------------------------------
// LOAD HISTORY
// ------------------------------------------

async function loadHistory() {

    const historyList =
        document.getElementById("historyList");

    if (!historyList) return;


    historyList.innerHTML =
        "<p style='color:#718096;'>Loading reviews...</p>";


    try {

        const response =
            await fetch(`${API_URL}/api/reviews`);


        if (!response.ok) {
            throw new Error("History API failed");
        }


        const reviews =
            await response.json();


        window.allHistoryReviews =
            reviews;


        displayHistory(reviews);


    } catch (error) {

        console.error(
            "History loading error:",
            error
        );


        historyList.innerHTML =
            "<p style='color:#d33;'>Unable to load review history.</p>";

    }

}


// ------------------------------------------
// DISPLAY HISTORY
// ------------------------------------------

function displayHistory(reviews) {

    const historyList =
        document.getElementById("historyList");

    if (!historyList) return;


    if (!reviews || reviews.length === 0) {

        historyList.innerHTML = `
            <div style="
                padding:30px;
                text-align:center;
                color:#718096;
            ">
                No reviews found.
            </div>
        `;

        return;
    }


    historyList.innerHTML = "";


    reviews.forEach(function(review) {

        const row =
            document.createElement("div");

        row.className =
            "reviewrow";


        row.innerHTML = `

            <div style="flex:1;">

                <div style="
                    font-weight:600;
                    margin-bottom:6px;
                    color:#17365d;
                ">
                    ${escapeHTML(review.text)}
                </div>

                <small style="
                    color:#718096;
                ">
                    ${escapeHTML(review.service)}
                    •
                    ${formatDate(review.created_at)}
                </small>

            </div>


            <div style="
                display:flex;
                align-items:center;
                gap:12px;
            ">

               <span style="
    padding:5px 12px;
    border-radius:20px;
    font-size:12px;
    font-weight:600;
    background:${
        review.sentiment === "Positive"
            ? "#e6f7ed"
            : review.sentiment === "Neutral"
            ? "#fff6d8"
            : "#fde8e8"
    };
    color:${
        review.sentiment === "Positive"
            ? "#159447"
            : review.sentiment === "Neutral"
            ? "#c28a00"
            : "#e53935"
    };
">
    ${escapeHTML(review.sentiment)}
</span>

                <div style="
    width:90px;
">

    <div style="
        display:flex;
        justify-content:space-between;
        font-size:11px;
        color:#718096;
        margin-bottom:4px;
    ">
        <span>Confidence</span>
        <b>
            ${Number(review.confidence).toFixed(1)}%
        </b>
    </div>

    <div style="
        width:100%;
        height:6px;
        background:#e9eef5;
        border-radius:10px;
        overflow:hidden;
    ">

        <div style="
            width:${Number(review.confidence)}%;
            height:100%;
            border-radius:10px;
            background:${
                Number(review.confidence) >= 85
                    ? "#159447"
                    : Number(review.confidence) >= 80
                    ? "#f2c94c"
                    : "#e53935"
            };
        "></div>

    </div>

</div>

            </div>

        `;


        historyList.appendChild(row);

    });

}


// ------------------------------------------
// HISTORY SEARCH
// ------------------------------------------

const historySearch =
    document.getElementById("historySearch");

const historyService =
    document.getElementById("historyService");

const historySentiment =
    document.getElementById("historySentiment");


if (historySearch) {

    historySearch.addEventListener(
        "input",
        filterHistory
    );

}


if (historyService) {

    historyService.addEventListener(
        "change",
        filterHistory
    );

}


if (historySentiment) {

    historySentiment.addEventListener(
        "change",
        filterHistory
    );

}


// ------------------------------------------
// FILTER HISTORY
// ------------------------------------------

function filterHistory() {

    const reviews =
        window.allHistoryReviews || [];


    const search =
        historySearch
            ? historySearch.value
                .toLowerCase()
                .trim()
            : "";


    const service =
        historyService
            ? historyService.value
            : "All";


    const sentiment =
        historySentiment
            ? historySentiment.value
            : "All";


    const filtered =
        reviews.filter(function(review) {

            const matchesSearch =
                review.text
                    .toLowerCase()
                    .includes(search);


            const matchesService =
                service === "All" ||
                review.service === service;


            const matchesSentiment =
                sentiment === "All" ||
                review.sentiment === sentiment;


            return (
                matchesSearch &&
                matchesService &&
                matchesSentiment
            );

        });


    displayHistory(filtered);

}


// ------------------------------------------
// DATE FORMAT
// ------------------------------------------

function formatDate(dateString) {

    if (!dateString) return "";

    const date =
        new Date(dateString);


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}
// ==========================================
// EXPORT ANALYTICS REPORT
// ==========================================

async function exportAnalyticsReport() {

    try {

        const response =
            await fetch(`${API_URL}/api/reviews`);

        if (!response.ok) {
            throw new Error("Reviews API failed");
        }

        const reviews =
            await response.json();

        if (!reviews || reviews.length === 0) {

            alert("No review data available to export.");

            return;
        }

        let csv =
            "ID,Review,Service,Sentiment,Confidence,Date\n";

        reviews.forEach(function(review) {

            const text =
                `"${String(review.text || "")
                    .replace(/"/g, '""')}"`;

            const service =
                `"${String(review.service || "")
                    .replace(/"/g, '""')}"`;

            const sentiment =
                `"${String(review.sentiment || "")
                    .replace(/"/g, '""')}"`;

            const confidence =
                Number(review.confidence || 0)
                    .toFixed(1);

            const date =
                `"${String(review.created_at || "")
                    .replace(/"/g, '""')}"`;

            csv +=
                `${review.id},${text},${service},${sentiment},${confidence},${date}\n`;
        });

        const blob =
            new Blob([csv], {
                type: "text/csv;charset=utf-8;"
            });

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        const today =
    new Date().toISOString().slice(0, 10);

    link.download =
        `bank_muscat_sentiment_report_${today}.csv`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        alert("Analytics report downloaded successfully.");

    } catch (error) {

        console.error(
            "Export Error:",
            error
        );

        alert(
            "Unable to export analytics report."
        );
    }
}