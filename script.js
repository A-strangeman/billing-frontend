const BASE_URL = "https://billing-backend-j0ui.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // LOGIN PAGE HOOK
  // -------------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch(`${BASE_URL}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include", // <-- send cookies on login
        });

        const data = await res.json();

        if (res.ok && data.success) {
          window.location.href = "welcome.html"; // No need to store currentUserId
        } else {
          alert(data.message || "Login failed");
        }
      } catch (err) {
        console.error(err);
        alert("Server error. Try again later.");
      }
    });
    return; // Stop further billing code if we're on login page
  }

  // -------------------------
  // COMPREHENSIVE DEBUG VERSION - Replace your edit_bill.html logic with this
  if (window.location.pathname.endsWith("edit_bill.html")) {
    console.log("🚀 Edit Bills Page Detected - Starting Debug Process");

    const billList = document.getElementById("billList");

    // Check if billList element exists
    if (!billList) {
      console.error(
        "❌ ERROR: billList element not found! Make sure you have <ul id='billList'> in your HTML"
      );
      return;
    }

    console.log("✅ billList element found:", billList);

    // Show loading message
    billList.innerHTML = "<li>Loading bills...</li>";

    console.log("📡 Making request to:", `${BASE_URL}/api/get-bills`);
    console.log("🔑 Using credentials: include");

    // Fetch bills for the logged-in user
    fetch(`${BASE_URL}/api/get-bills`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        console.log("📥 Response received:");
        console.log("   Status:", response.status);
        console.log("   Status Text:", response.statusText);
        console.log("   Headers:", [...response.headers.entries()]);

        if (!response.ok) {
          if (response.status === 401) {
            console.log("🚫 Authentication failed - user not logged in");
            billList.innerHTML =
              "<li style='color: red;'>Please log in to view your bills. <a href='index.html'>Go to Login</a></li>";
            return Promise.reject(new Error("Unauthorized"));
          }
          console.error("❌ HTTP Error:", response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("✅ Response OK - parsing JSON...");
        return response.json();
      })
      .then((billRecords) => {
        console.log("📊 Raw data received from server:");
        console.log("   Type:", typeof billRecords);
        console.log("   Is Array:", Array.isArray(billRecords));
        console.log("   Length:", billRecords?.length);
        console.log("   Full Data:", billRecords);

        if (!billRecords) {
          console.error("❌ billRecords is null/undefined");
          billList.innerHTML =
            "<li style='color: red;'>Error: No data received from server</li>";
          return;
        }

        if (!Array.isArray(billRecords)) {
          console.error("❌ billRecords is not an array:", typeof billRecords);
          billList.innerHTML =
            "<li style='color: red;'>Error: Invalid data format received</li>";
          return;
        }

        if (billRecords.length === 0) {
          console.log("📝 No bills found");
          billList.innerHTML =
            "<li style='color: blue;'>No bills found for this user.</li>";
          return;
        }

        console.log(`✅ Found ${billRecords.length} bill records`);

        // Clear loading message
        billList.innerHTML = "";

        billRecords.forEach((record, index) => {
          console.log(`\n🔍 Processing record ${index + 1}:`);
          console.log("   Record keys:", Object.keys(record));
          console.log("   Full record:", record);

          let bill = null;
          let parseMethod = "unknown";

          // Method 1: Try parsing billData (your server should provide this)
          if (record.billData) {
            try {
              console.log("   Method 1: Parsing billData field");
              console.log("   billData type:", typeof record.billData);
              console.log("   billData value:", record.billData);

              if (typeof record.billData === "string") {
                bill = JSON.parse(record.billData);
                parseMethod = "billData-string";
              } else if (typeof record.billData === "object") {
                bill = record.billData;
                parseMethod = "billData-object";
              }

              console.log("   ✅ Successfully parsed billData:", bill);
            } catch (e) {
              console.error("   ❌ Error parsing billData:", e);
              bill = null;
            }
          } else {
            console.log("   ⚠️ No billData field found in record");
          }

          // Method 2: Fallback - construct from database fields
          if (!bill) {
            console.log("   Method 2: Constructing from database fields");
            bill = {
              estimateNo: record.estimate_no || record.estimateNo || "N/A",
              customerName:
                record.customer_name || record.customerName || "Unknown",
              customerPhone:
                record.customer_phone || record.customerPhone || "",
              billDate: record.bill_date || record.billDate || "Unknown",
              items: [],
              subTotal: parseFloat(record.sub_total || record.subTotal || 0),
              discount: parseFloat(record.discount || 0),
              grandTotal: parseFloat(
                record.grand_total || record.grandTotal || 0
              ),
              received: parseFloat(record.received || 0),
              balance: parseFloat(record.balance || 0),
              amountWords: record.amount_words || record.amountWords || "",
            };

            // Try to parse items
            if (record.items) {
              try {
                bill.items =
                  typeof record.items === "string"
                    ? JSON.parse(record.items)
                    : record.items;
                console.log("   ✅ Items parsed:", bill.items);
              } catch (e) {
                console.error("   ❌ Error parsing items:", e);
                bill.items = [];
              }
            }

            parseMethod = "database-fields";
            console.log("   ✅ Constructed bill from database fields:", bill);
          }

          console.log(
            `   📋 Final bill object (method: ${parseMethod}):`,
            bill
          );

          // Create list item
          const li = document.createElement("li");
          li.innerHTML = `
                <div style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; background: #f9f9f9;">
                    <strong>Bill No:</strong> <span class="bill-no">${
                      bill.estimateNo || "N/A"
                    }</span><br>
                    <strong>Customer:</strong> ${
                      bill.customerName || "Unknown"
                    }<br>
                    <strong>Date:</strong> ${bill.billDate || "N/A"}<br>
                    <strong>Total:</strong> ₹${bill.grandTotal || "0.00"}<br>
                    <small>Parse Method: ${parseMethod}</small>
                    <div class="bill-actions" style="margin-top: 10px;">
                        <button class="edit-btn" style="background: #007bff; color: white; padding: 5px 10px; margin-right: 5px; border: none; cursor: pointer;">Edit</button>
                        <button class="delete-btn" style="background: #dc3545; color: white; padding: 5px 10px; border: none; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
          li.classList.add("bill-item");
          li.dataset.bill = JSON.stringify(bill);
          billList.appendChild(li);

          console.log(`   ✅ Added bill ${index + 1} to DOM`);
        });

        console.log("🎉 All bills processed successfully!");
      })
      .catch((error) => {
        console.error("💥 Final catch block - Error details:");
        console.error("   Error type:", error.constructor.name);
        console.error("   Error message:", error.message);
        console.error("   Error stack:", error.stack);

        if (error.message !== "Unauthorized") {
          billList.innerHTML = `
                <li style='color: red; padding: 10px;'>
                    <strong>Error loading bills:</strong><br>
                    ${error.message}<br>
                    <small>Check browser console for details</small>
                </li>
            `;
        }
      });

    // Enhanced Bill action buttons with debug logging
    billList.addEventListener("click", async (e) => {
      console.log("🖱️ Click event on bill list:", e.target);

      const clickedItem = e.target.closest(".bill-item");
      if (!clickedItem) {
        console.log("   No bill item found in click target");
        return;
      }

      console.log("   Clicked bill item:", clickedItem);

      // Remove active class from other items
      document.querySelectorAll(".bill-item").forEach((item) => {
        if (item !== clickedItem) {
          item.classList.remove("active");
        }
      });

      clickedItem.classList.toggle("active");

      if (e.target.classList.contains("edit-btn")) {
        console.log("📝 Edit button clicked");

        const billToEdit = JSON.parse(clickedItem.dataset.bill);
        console.log("   Bill to edit:", billToEdit);

        // Store the bill data for editing
        localStorage.setItem("billToEdit", JSON.stringify(billToEdit));
        console.log("   Stored in localStorage, redirecting to make_bill.html");

        window.location.href = "make_bill.html";
      } else if (e.target.classList.contains("delete-btn")) {
        console.log("🗑️ Delete button clicked");

        const billToDelete = JSON.parse(clickedItem.dataset.bill);
        const billNo = clickedItem.querySelector(".bill-no").textContent;

        console.log("   Bill to delete:", billToDelete);
        console.log("   Bill number:", billNo);

        if (confirm(`Are you sure you want to delete bill ${billNo}?`)) {
          try {
            const deletePayload = {
              estimateNo: billToDelete.estimateNo,
            };

            console.log(
              "   Sending delete request with payload:",
              deletePayload
            );

            const response = await fetch(`${BASE_URL}/api/delete-bill`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(deletePayload),
            });

            console.log("   Delete response status:", response.status);
            const result = await response.json();
            console.log("   Delete response data:", result);

            if (response.ok && result.success) {
              clickedItem.remove();
              alert("Bill deleted successfully");

              // Check if no bills left
              if (billList.children.length === 0) {
                billList.innerHTML = "<li>No bills found for this user.</li>";
              }
            } else {
              console.error("   Delete failed:", result);
              alert(result.message || "Failed to delete bill");
            }
          } catch (error) {
            console.error("   Error deleting bill:", error);
            alert("Error deleting bill. Please try again.");
          }
        }
      }
    });
    return;
  }

  // ---------- ELEMENTS FOR make_bill.html ----------
  const billTable = document.getElementById("billTable");
  if (!billTable) return; // Exit if not on the make_bill page

  const tbody = billTable.querySelector("tbody");
  const billDateEl = document.getElementById("billDate");
  const addRowBtn = document.getElementById("addRowBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const discountEl = document.getElementById("discount");
  const receivedEl = document.getElementById("received");
  const subTotalEl = document.getElementById("subTotal");
  const grandTotalEl = document.getElementById("grandTotal");
  const balanceEl = document.getElementById("balance");
  const amountWordsEl = document.getElementById("amountWords");

  const estimateNoEl = document.getElementById("estimateNo");
  const customerNameEl = document.getElementById("customerName");
  const customerPhoneEl = document.getElementById("customerPhone");

  const catRow = document.getElementById("catRow");
  const materialBlockplumbing = document.getElementById(
    "materialBlockplumbing"
  );
  const materialBlockwiring = document.getElementById("materialBlockwiring");
  const materialBlockCEMENT = document.getElementById("materialBlockCEMENT");
  const materialBlockTMT = document.getElementById("materialBlockTMT");
  const materialBlockPAINT = document.getElementById("materialBlockPAINT");
  const materialBlockTIN = document.getElementById("materialBlockTIN");
  const materialBlockDOOR = document.getElementById("materialBlockDOOR");
  const materialBlockPLY = document.getElementById("materialBlockPLY");
  const materialBlockTILE = document.getElementById("materialBlockTILE");
  const materialBlockPIPE = document.getElementById("materialBlockPIPE");
  const materialBlockTractor = document.getElementById("materialBlockTractor");
  const materialRowplumbing = document.getElementById("materialRowplumbing");
  const materialRowwiring = document.getElementById("materialRowwiring");
  const materialRowTMT = document.getElementById("materialRowTMT");
  const materialRowDOOR = document.getElementById("materialRowDOOR");
  const materialRowCEMENT = document.getElementById("materialRowCEMENT");
  const materialRowPAINT = document.getElementById("materialRowPAINT");
  const materialRowTIN = document.getElementById("materialRowTIN");
  const materialRowPLY = document.getElementById("materialRowPLY");
  const materialRowTILE = document.getElementById("materialRowTILE");
  const materialRowPIPE = document.getElementById("materialRowPIPE");
  const materialRowTractor = document.getElementById("materialRowTractor");

  const MATERIAL_CANON = {
    wire: "WIRE",
    "switch board": "SWITCHBOARD",
    single: "SINGLE",
    modular: "MODULAR",
    box: "BOX",
    mcb: "MCB",
    "mcb-box": "MCB_BOX",
    pipe: "PIPE",
    screw: "SCREW",
    "fiber-plate": "FIBER_PLATE",
    "wire beet": "WIRE_BEET",
    "gi-wire": "GI_WIRE",
  };

  const sizeBlocks = {
    CPVC: document.getElementById("sizeBlockCPVC"),
    PVC: document.getElementById("sizeBlockPVC"),
    GI: document.getElementById("sizeBlockGI"),
    Passion: document.getElementById("sizeBlockPassion"),
    Tank: document.getElementById("sizeBlockTank"),
    Black: document.getElementById("sizeBlockBlack"),
    WIRE: document.getElementById("sizeBlockWIRE"),
    SWITCHBOARD: document.getElementById("sizeBlockSWITCHBOARD"),
    MODULAR: document.getElementById("sizeBlockMODULAR"),
    BOX: document.getElementById("sizeBlockBOX"),
    MCB: document.getElementById("sizeBlockMCB"),
    "MCB-BOX": document.getElementById("sizeBlockMCB-BOX"),
    PIPE: document.getElementById("sizeBlockPIPE"),
    "WIRE-BEET": document.getElementById("sizeBlockWIRE-BEET"),
    SCREW: document.getElementById("sizeBlockSCREW"),
    SINGLE: document.getElementById("sizeBlockSINGLE"),
    "FIBER-PLATE": document.getElementById("sizeBlockFIBER-PLATE"),
    Jenosolin: document.getElementById("sizeBlockJenosolin"),
    "BP Exterior": document.getElementById("sizeBlockBP Exterior"),
    "BP Interior": document.getElementById("sizeBlockBP Interior"),
    "Exterior A-Guard Primer": document.getElementById(
      "sizeBlockExterior A-Guard Primer"
    ),
    "All Guard": document.getElementById("sizeBlockAll Guard"),
    Walmasta: document.getElementById("sizeBlockWalmasta"),
    Silk: document.getElementById("sizeBlockSilk"),
    "Easy Clean": document.getElementById("sizeBlockEasy Clean"),
    Bison: document.getElementById("sizeBlockBison"),
    "Berger Gold": document.getElementById("sizeBlockBerger Gold"),
    Brolac: document.getElementById("sizeBlockBrolac"),
    Umbrella: document.getElementById("sizeBlockUmbrella"),
    Enamel: document.getElementById("sizeBlockEnamel"),
    "Metal Primer": document.getElementById("sizeBlockMetal Primer"),
    "Wood Primer": document.getElementById("sizeBlockWood Primer"),
    Brush: document.getElementById("sizeBlockBrush"),
    Roller: document.getElementById("sizeBlockRoller"),
    Putty: document.getElementById("sizeBlockPutty"),
    "Aarti Color": document.getElementById("sizeBlockAarti Color"),
    "Aarti White": document.getElementById("sizeBlockAarti White"),
    "Hilti Screw": document.getElementById("sizeBlockHilti Screw"),
    Maigra: document.getElementById("sizeBlockMaigra"),
    Nails: document.getElementById("sizeBlockNails"),
    "Tin Killa": document.getElementById("sizeBlockTin Killa"),
    "18mm": document.getElementById("sizeBlock18mm"),
    "12mm": document.getElementById("sizeBlock12mm"),
    "10mm": document.getElementById("sizeBlock10mm"),
    "6mm": document.getElementById("sizeBlock6mm"),
    Fevicol: document.getElementById("sizeBlockFevicol"),
    Heatex: document.getElementById("sizeBlockHeatex"),
    Beet: document.getElementById("sizeBlockBeet"),
    "25 Digital": document.getElementById("sizeBlock25 Digital"),
    "32 Digital": document.getElementById("sizeBlock32 Digital"),
    "25 PVC": document.getElementById("sizeBlock25 PVC"),
    "32 PVC": document.getElementById("sizeBlock32 PVC"),
    Tank: document.getElementById("sizeBlockTank"),
    Balu: document.getElementById("sizeBlockBalu"),
    Gitti: document.getElementById("sizeBlockGitti"),
    Filter: document.getElementById("sizeBlockFilter"),
    "Plasatar Balu": document.getElementById("sizeBlockPlasatar Balu"),
  };

  const fittingBlocks = {
    CPVC: document.getElementById("fittingBlockCPVC"),
    PVC: document.getElementById("fittingBlockPVC"),
    GI: document.getElementById("fittingBlockGI"),
    Black: document.getElementById("fittingBlockBlack"),
    WIRE: document.getElementById("fittingBlockWIRE"),
    SWITCHBOARD: document.getElementById("fittingBlockSWITCHBOARD"),
    MODULAR: document.getElementById("fittingBlockMODULAR"),
    MCB: document.getElementById("fittingBlockMCB"),
    "Aarti Color": document.getElementById("fittingBlockAarti Color"),
    "Aarti White": document.getElementById("fittingBlockAarti White"),
    "18mm": document.getElementById("fittingBlock18mm"),
    "12mm": document.getElementById("fittingBlock12mm"),
    "10mm": document.getElementById("fittingBlock10mm"),
    "6mm": document.getElementById("fittingBlock6mm"),
    Beet: document.getElementById("fittingBlockBeet") || null,
  };

  // ---------- STATE ----------
  let sn = 1;
  let activeRow = null;
  let selectedCategory = null;
  let selectedMaterial = null;
  let selectedSize = null;
  let selectedFitting = null;
  let plyLength = null;
  let plyWidth = null;
  let plyCount = null;

  // ---------- INIT ----------
  // This is the key section that loads the bill data
  const savedBill = JSON.parse(localStorage.getItem("billToEdit"));
  if (savedBill) {
    // Load the saved bill data
    estimateNoEl.value = savedBill.estimateNo || "";
    customerNameEl.value = savedBill.customerName || "";
    customerPhoneEl.value = savedBill.customerPhone || "";
    billDateEl.value =
      savedBill.billDate || new Date().toISOString().split("T")[0];
    discountEl.value = savedBill.discount || 0;
    receivedEl.value = savedBill.received || 0;

    // Clear existing rows first
    tbody.innerHTML = "";

    // Populate the table rows
    if (savedBill.items && savedBill.items.length > 0) {
      savedBill.items.forEach((item) => {
        addRow(
          item.product || "",
          item.qty || 1,
          item.unit || "Pcs",
          item.price || 0
        );
      });
    } else {
      // Add at least one empty row if no items
      addRow();
    }

    // Clear the stored bill so it's not loaded again on refresh
    localStorage.removeItem("billToEdit");
  } else {
    // This is for new bills
    billDateEl.value = new Date().toISOString().split("T")[0];
    addRow();
    let lastEstimate = parseInt(
      localStorage.getItem("lastEstimateNo") || "0",
      10
    );
    lastEstimate++;
    localStorage.setItem("lastEstimateNo", lastEstimate);
    estimateNoEl.value = lastEstimate;
  }

  // --- `saveAndDownloadBill` FUNCTION & HELPER ---
  function getBillData() {
    const tableData = [];
    tbody.querySelectorAll("tr").forEach((tr) => {
      const product = tr.querySelector(".product").value || "";
      const unit = tr.querySelector(".unit").value || "";
      const qty = parseFloat(tr.querySelector(".qty").value || 0);
      const price = parseFloat(tr.querySelector(".price").value || 0);
      const rowTotal = qty * price;
      tableData.push({ product, unit, qty, price, rowTotal });
    });

    return {
      // Keep using frontend field names - your server expects these
      estimateNo: estimateNoEl.value,
      customerName: customerNameEl.value,
      customerPhone: customerPhoneEl.value,
      billDate: billDateEl.value,
      items: tableData,
      subTotal: parseFloat(subTotalEl.value),
      discount: parseFloat(discountEl.value),
      grandTotal: parseFloat(grandTotalEl.value),
      received: parseFloat(receivedEl.value),
      balance: parseFloat(balanceEl.value),
      amountWords: amountWordsEl ? amountWordsEl.value : "",
    };
  }

  // ------------- saveAndDownloadBill (fixed) -------------
  async function saveAndDownloadBill() {
    const billData = getBillData();

    // Ensure fetch includes credentials so session cookie goes to server.
    try {
      const response = await fetch(`${BASE_URL}/api/save-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT: send session cookie
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        // try to parse json error, fallback to text
        let errText = "";
        try {
          errText = JSON.stringify(await response.json());
        } catch (e) {
          errText = await response.text();
        }
        console.error(
          "Failed to save bill on server:",
          response.status,
          errText
        );
        // still proceed to generate PDF
        alert(
          "Warning: bill could not be saved to server. PDF will still be generated."
        );
      } else {
        console.log("Bill saved successfully on server.");
      }
    } catch (err) {
      console.error("Network / save error:", err);
      alert("Warning: error while saving bill. PDF will still be generated.");
    }

    // Generate and download the PDF using the same data we just saved
    try {
      await downloadPDF(billData);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. See console for details.");
    }
  }

  // --- EVENT LISTENERS ---
  addRowBtn.addEventListener("click", () => addRow());
  discountEl.addEventListener("input", computeTotals);
  receivedEl.addEventListener("input", computeTotals);

  if (downloadBtn) {
    downloadBtn.addEventListener("click", saveAndDownloadBill);
  }
  computeTotals();

  // ---------- TABLE ----------
  function addRow(product = "", qty = "", unit = "Pcs", price = "") {
    const tr = document.createElement("tr");
    tr.innerHTML = `
          <td class="sn"></td>
          <td><input type="text" class="product" value="${product}"></td>
          <td><input type="number" class="qty" min="1" value="${qty}"></td>
          <td>
            <select class="unit">
              <option value="Pcs">Pcs</option>
              <option value="Kg">Kg</option>
              <option value="Sq-Ft">Sq-Ft</option>
              <option value="Pkts">Pkts</option>
              <option value="Mtr">Mtr</option>
              <option value="Bundle">Bundle</option>
              <option value="ft">ft</option>
              <option value="Trip">Trip</option>
            </select>
          </td>
          <td><input type="number" class="price" min="0" value="${price}"></td>
          <td class="row-total">0.00</td>
          <td><button class="del">×</button></td>
        `;
    tbody.appendChild(tr);
    renumber();

    const productInput = tr.querySelector(".product");
    const qtyInput = tr.querySelector(".qty");
    const priceInput = tr.querySelector(".price");
    const unitSelect = tr.querySelector(".unit");

    if (unit) {
      unitSelect.value = unit;
    }

    productInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        qtyInput.focus();
      }
    });
    qtyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        priceInput.focus();
      }
    });
    priceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addRow();
        setTimeout(() => {
          const rows = tbody.querySelectorAll("tr");
          const lastRow = rows[rows.length - 1];
          if (lastRow) {
            const productField = lastRow.querySelector(".product");
            if (productField) productField.focus();
          }
        }, 0);
      }
    });

    qtyInput.addEventListener("input", computeTotals);
    priceInput.addEventListener("input", computeTotals);
    tr.querySelector(".del").addEventListener("click", () => {
      tr.remove();
      renumber();
      computeTotals();
      if (activeRow === tr) activeRow = null;
    });
    tr.addEventListener("click", () => setActiveRow(tr));
    setActiveRow(tr);
    computeTotals();
  }

  function renumber() {
    sn = 1;
    [...tbody.querySelectorAll("tr")].forEach((tr) => {
      tr.querySelector(".sn").textContent = sn++;
    });
  }

  function setActiveRow(tr) {
    if (activeRow) activeRow.classList.remove("active");
    activeRow = tr;
    if (activeRow) activeRow.classList.add("active");
  }

  function getNextEstimateNo() {
    let lastEstimate = parseInt(
      localStorage.getItem("lastEstimateNo") || "0",
      10
    );
    lastEstimate++;
    localStorage.setItem("lastEstimateNo", lastEstimate);
    return lastEstimate;
  }

  if (estimateNoEl && !estimateNoEl.value) {
    estimateNoEl.value = getNextEstimateNo();
  }

  function calculatePlyUnits() {
    if (!activeRow || selectedCategory !== "Ply") {
      return;
    }
    const qtyInput = activeRow.querySelector(".qty");
    const unitSelect = activeRow.querySelector(".unit");
    if (plyLength && plyWidth && plyCount) {
      const totalUnits = plyLength * plyWidth * plyCount;
      qtyInput.value = totalUnits;
      unitSelect.value = "Sq-Ft";
    } else {
      qtyInput.value = 1;
    }
    computeTotals();
  }

  function computeTotals() {
    let subTotal = 0;
    tbody.querySelectorAll("tr").forEach((tr) => {
      const qty = parseFloat(tr.querySelector(".qty").value) || 0;
      const price = parseFloat(tr.querySelector(".price").value) || 0;
      const rowTotal = qty * price;
      tr.querySelector(".row-total").textContent = rowTotal.toFixed(2);
      subTotal += rowTotal;
    });
    const discount = parseFloat(discountEl.value) || 0;
    const received = parseFloat(receivedEl.value) || 0;
    const grandTotal = Math.max(subTotal - discount, 0);
    const balance = Math.max(grandTotal - received, 0);
    subTotalEl.value = subTotal.toFixed(2);
    grandTotalEl.value = grandTotal.toFixed(2);
    balanceEl.value = balance.toFixed(2);
    if (amountWordsEl) {
      amountWordsEl.value =
        numberToWordsIndian(Math.round(grandTotal)) + " only";
    }
  }

  if (catRow) {
    catRow.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#catRow .chip");
      selectedCategory = chip.dataset.cat;
      selectedMaterial = selectedSize = selectedFitting = null;
      materialBlockplumbing.style.display = "none";
      materialBlockwiring.style.display = "none";
      materialBlockCEMENT.style.display = "none";
      materialBlockDOOR.style.display = "none";
      materialBlockTMT.style.display = "none";
      materialBlockTILE.style.display = "none";
      materialBlockPAINT.style.display = "none";
      materialBlockTIN.style.display = "none";
      materialBlockPLY.style.display = "none";
      materialBlockPIPE.style.display = "none";
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      switch (selectedCategory) {
        case "Plumbing":
          materialBlockplumbing.style.display = "block";
          break;
        case "Wiring":
          materialBlockwiring.style.display = "block";
          break;
        case "TMT":
          materialBlockTMT.style.display = "block";
          break;
        case "Cement":
          materialBlockCEMENT.style.display = "block";
          break;
        case "Paint":
          materialBlockPAINT.style.display = "block";
          break;
        case "Tin":
          materialBlockTIN.style.display = "block";
          break;
        case "Ply":
          materialBlockPLY.style.display = "block";
          break;
        case "Door":
          materialBlockDOOR.style.display = "block";
          break;
        case "Tile":
          materialBlockTILE.style.display = "block";
          break;
        case "Pipe":
          materialBlockPIPE.style.display = "block";
          break;
        case "Tractor":
          materialBlockTractor.style.display = "block";
          break;
        default:
          pushToActiveRow(selectedCategory);
          break;
      }
    });
  }

  if (materialRowplumbing) {
    materialRowplumbing.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowplumbing .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      selectedSize = selectedFitting = null;
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      if (selectedMaterial === "CPVC") {
        show(sizeBlocks.CPVC, fittingBlocks.CPVC);
      } else if (selectedMaterial === "PVC") {
        show(sizeBlocks.PVC, fittingBlocks.PVC);
      } else if (selectedMaterial === "GI") {
        show(sizeBlocks.GI, fittingBlocks.GI);
      } else if (selectedMaterial === "Passion") {
        show(sizeBlocks.Passion, null);
      } else if (selectedMaterial === "Black") {
        show(sizeBlocks.Black, null);
      } else if (selectedMaterial === "Tank") {
        show(sizeBlocks.Tank, null);
      } else {
        updateProductName();
      }
    });
  }

  if (materialRowwiring) {
    materialRowwiring.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowwiring .chip");
      const raw = (chip.dataset.mat || "").trim().toLowerCase();
      const canon = MATERIAL_CANON[raw];
      selectedMaterial = canon || raw;
      selectedSize = selectedFitting = null;
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlock = sizeBlocks[selectedMaterial];
      const fittingBlock = fittingBlocks[selectedMaterial];
      if (sizeBlock || fittingBlock) {
        show(sizeBlock, fittingBlock);
      } else {
        updateProductName();
      }
    });
  }

  if (materialRowPLY) {
    materialRowPLY.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowPLY .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      selectedSize = null;
      selectedFitting = null;
      plyLength = null;
      plyWidth = null;
      plyCount = null;
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlockToShow = sizeBlocks[selectedMaterial];
      const fittingBlockToShow = fittingBlocks[selectedMaterial];
      if (sizeBlockToShow) sizeBlockToShow.style.display = "block";
      if (fittingBlockToShow) fittingBlockToShow.style.display = "block";
      if (!sizeBlockToShow && !fittingBlockToShow) {
        updateProductName();
      }
    });
  }

  if (materialRowTIN) {
    materialRowTIN.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowTIN .chip");
      const raw = (chip.dataset.mat || "").trim();
      selectedMaterial = raw;
      selectedSize = selectedFitting = null;
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlock = sizeBlocks[selectedMaterial];
      const fittingBlock = fittingBlocks[selectedMaterial];
      if (sizeBlock) {
        show(sizeBlock);
      }
      if (fittingBlock) {
        show(fittingBlock);
      }
      if (!sizeBlock && !fittingBlock) {
        updateProductName();
      }
    });
  }

  if (materialRowPAINT) {
    materialRowPAINT.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowPAINT .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlockToShow = sizeBlocks[selectedMaterial];
      if (sizeBlockToShow) {
        sizeBlockToShow.style.display = "block";
      }
      selectedSize = selectedFitting = null;
      updateProductName();
    });
  }

  if (materialRowDOOR) {
    materialRowDOOR.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowDOOR .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlockToShow = sizeBlocks[selectedMaterial];
      if (sizeBlockToShow) {
        sizeBlockToShow.style.display = "block";
      }
      selectedSize = selectedFitting = null;
      updateProductName();
    });
  }

  if (materialRowTractor) {
    materialRowTractor.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowTractor .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlockToShow = sizeBlocks[selectedMaterial];
      if (sizeBlockToShow) {
        sizeBlockToShow.style.display = "block";
      }
      selectedSize = selectedFitting = null;
      updateProductName();
    });
  }

  if (materialRowPIPE) {
    materialRowPIPE.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowPIPE .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlockToShow = sizeBlocks[selectedMaterial];
      if (sizeBlockToShow) {
        sizeBlockToShow.style.display = "block";
      }
      selectedSize = selectedFitting = null;
      updateProductName();
    });
  }

  if (materialRowTILE) {
    materialRowTILE.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowTILE .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      const sizeBlockToShow = sizeBlocks[selectedMaterial];
      if (sizeBlockToShow) {
        sizeBlockToShow.style.display = "block";
      }
      selectedSize = selectedFitting = null;
      updateProductName();
    });
  }

  if (materialRowCEMENT) {
    materialRowCEMENT.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowCEMENT .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      selectedSize = selectedFitting = null;
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      updateProductName();
    });
  }

  if (materialRowTMT) {
    materialRowTMT.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activateSingle(chip, "#materialRowTMT .chip");
      selectedMaterial = (chip.dataset.mat || "").trim();
      selectedSize = selectedFitting = null;
      hideAllSizeBlocks();
      hideAllFittingBlocks();
      updateProductName();
    });
  }

  function show(sizeBlock, fittingBlock) {
    if (sizeBlock) sizeBlock.style.display = "block";
    if (fittingBlock) fittingBlock.style.display = "block";
  }

  Object.values(sizeBlocks).forEach((block) => {
    if (!block) return;
    block.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      block
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedSize = chip.dataset.size;
      if (selectedCategory === "Ply") {
        const dimensions = selectedSize.match(/\d+/g);
        if (dimensions && dimensions.length === 2) {
          plyLength = parseInt(dimensions[0]);
          plyWidth = parseInt(dimensions[1]);
        } else {
          plyLength = null;
          plyWidth = null;
        }
        calculatePlyUnits();
      }
      updateProductName();
    });
  });

  Object.values(fittingBlocks).forEach((block) => {
    if (!block) return;
    block.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      block
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedFitting = chip.dataset.fit;
      if (selectedCategory === "Ply") {
        if (chip.closest('[id^="fittingBlock"][id$="mm"]')) {
          plyCount = parseInt(selectedFitting);
        }
        calculatePlyUnits();
      }
      updateProductName();
    });
  });

  function hideAllSizeBlocks() {
    Object.values(sizeBlocks).forEach(
      (block) => block && (block.style.display = "none")
    );
  }

  function hideAllFittingBlocks() {
    Object.values(fittingBlocks).forEach(
      (block) => block && (block.style.display = "none")
    );
  }

  function activateSingle(chip, selector) {
    document
      .querySelectorAll(selector)
      .forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
  }

  function updateProductName() {
    if (!activeRow) return;
    const parts = [];
    if (selectedMaterial) parts.push(selectedMaterial);
    if (selectedSize) parts.push(selectedSize);
    if (selectedFitting) parts.push(selectedFitting);

    if (parts.length === 0 && selectedCategory) parts.push(selectedCategory);

    const productInput = activeRow.querySelector(".product");
    productInput.value = parts.join(" ");

    if (selectedCategory === "Ply") {
      calculatePlyUnits();
    } else {
      const qtyInput = activeRow.querySelector(".qty");
      qtyInput.focus();
    }
  }

  function pushToActiveRow(text) {
    if (!activeRow) return;
    const productInput = activeRow.querySelector(".product");
    productInput.value = text;
    const qtyInput = activeRow.querySelector(".qty");
    qtyInput.focus();
  }

  // ---------- PDF ----------
  // ------------- saveAndDownloadBill (fixed) -------------
  async function saveAndDownloadBill() {
    const billData = getBillData();

    // If you migrated backend to session-based auth, you don't need to send userId.
    // Ensure fetch includes credentials so session cookie goes to server.
    try {
      const response = await fetch(`${BASE_URL}/api/save-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT: send session cookie
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        // try to parse json error, fallback to text
        let errText = "";
        try {
          errText = JSON.stringify(await response.json());
        } catch (e) {
          errText = await response.text();
        }
        console.error(
          "Failed to save bill on server:",
          response.status,
          errText
        );
        // still proceed to generate PDF
        alert(
          "Warning: bill could not be saved to server. PDF will still be generated."
        );
      } else {
        console.log("Bill saved successfully on server.");
      }
    } catch (err) {
      console.error("Network / save error:", err);
      alert("Warning: error while saving bill. PDF will still be generated.");
    }

    // Generate and download the PDF using the same data we just saved
    try {
      await downloadPDF(billData);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. See console for details.");
    }
  }

  // ------------- downloadPDF accepts billData -------------
  async function downloadPDF(billData = null) {
    // If no billData passed, read from DOM (backwards-compatible)
    if (!billData) billData = getBillData();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    const companyName = "ABC Company";
    const companyPhone = "Phone: 9825333385";
    const estimateNo = billData.estimateNo || "-";
    const date = billData.billDate || "-";
    const cust = billData.customerName || "-";
    const phone = billData.customerPhone || "-";
    const subTotal = (billData.subTotal || 0).toFixed(2);
    const discount = (billData.discount || 0).toFixed(2);
    const grandTotal = (billData.grandTotal || 0).toFixed(2);
    const received = (billData.received || 0).toFixed(2);
    const balance = (billData.balance || 0).toFixed(2);
    const amountWords = billData.amountWords || "";

    // Header
    doc.setFontSize(16);
    doc.text("Estimated Bill", 297.5, 30, { align: "center" });

    doc.setFontSize(18).setFont(undefined, "bold");
    doc.text(companyName, 40, 60);
    doc.setFontSize(10).setFont(undefined, "normal");
    doc.text(companyPhone, 40, 75);

    // Info box
    const leftX = 40,
      rightX = 340,
      boxY = 95,
      boxH = 60,
      boxW = 515;
    doc.rect(leftX, boxY, boxW, boxH);
    doc.line(rightX, boxY, rightX, boxY + boxH);

    doc.setFontSize(11);
    doc.text("Bill To:", leftX + 8, boxY + 18);
    doc.setFontSize(10);
    doc.text(cust, leftX + 8, boxY + 34);
    if (phone) doc.text(phone, leftX + 8, boxY + 50);

    doc.setFontSize(11);
    doc.text("Estimate Details:", rightX + 8, boxY + 18);
    doc.setFontSize(10);
    doc.text(`No: ${estimateNo}`, rightX + 8, boxY + 34);
    doc.text(`Date: ${date}`, rightX + 8, boxY + 50);

    // Create tableData from billData.items
    const tableData = (billData.items || []).map((it, idx) => {
      const sn = (idx + 1).toString();
      const prod = it.product || "";
      const qty = (it.qty || 0).toString();
      const unit = it.unit || "";
      const price = Number(it.price || 0).toFixed(2);
      const amt = Number(
        it.rowTotal || (it.qty && it.price ? it.qty * it.price : 0)
      ).toFixed(2);
      return [sn, prod, qty, unit, `Rs. ${price}`, `Rs. ${amt}`];
    });

    // autoTable requires the plugin; make sure it's loaded in your HTML
    doc.autoTable({
      head: [
        ["#", "Item name", "Quantity", "Unit", "Price/ Unit(Rs)", "Amount(Rs)"],
      ],
      body: tableData,
      startY: boxY + boxH + 20,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [60, 60, 60], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 220 },
        2: { cellWidth: 65, halign: "right" },
        3: { cellWidth: 50 },
        4: { cellWidth: 95, halign: "right" },
        5: { cellWidth: 95, halign: "right" },
      },
    });

    // Totals (placed below table)
    let y = doc.lastAutoTable
      ? doc.lastAutoTable.finalY + 8
      : boxY + boxH + 20 + tableData.length * 12;
    doc.setFont(undefined, "bold");
    doc.text(`Total`, 40, y + 15);
    doc.text(`Rs. ${grandTotal}`, 500, y + 15, { align: "right" });

    y += 40;
    doc.setFont(undefined, "normal");
    doc.text(`Sub Total :`, 400, y);
    doc.text(`Rs. ${subTotal}`, 575, y, { align: "right" });

    y += 15;
    doc.text(`Discount :`, 400, y);
    doc.text(`Rs. ${discount}`, 575, y, { align: "right" });

    y += 15;
    doc.setFont(undefined, "bold");
    doc.text(`Total :`, 400, y);
    doc.text(`Rs. ${grandTotal}`, 575, y, { align: "right" });

    // Amount in words
    if (amountWords) {
      y += 30;
      doc.setFont(undefined, "normal");
      doc.text("Invoice Amount in Words:", 40, y);
      const splitWords = doc.splitTextToSize(amountWords, 515);
      doc.text(splitWords, 40, y + 15);
      y += 40 + splitWords.length * 12;
    } else {
      y += 30;
    }

    doc.text("Received :", 400, y);
    doc.text(`Rs. ${received}`, 575, y, { align: "right" });

    y += 15;
    doc.text("Balance :", 400, y);
    doc.text(`Rs. ${balance}`, 575, y, { align: "right" });

    // safe filename
    const safeName = `${estimateNo || "Estimate"} - ${
      billData.customerName || "Bill"
    }`.replace(/[\/\\:?*"<>|]+/g, "_");
    doc.save(`${safeName}.pdf`);
  }

  // ---------- NUMBER TO WORDS (Indian System) ----------
  function numberToWordsIndian(num) {
    if (num === 0) return "Zero Rupees";
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " and " + inWords(n % 100) : "")
        );
      return "";
    }

    let s = "";
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    const rest = num % 100;

    if (crore) s += inWords(crore) + " Crore ";
    if (lakh) s += inWords(lakh) + " Lakh ";
    if (thousand) s += inWords(thousand) + " Thousand ";
    if (hundred) s += a[hundred] + " Hundred ";
    if (rest) s += (s !== "" ? "and " : "") + inWords(rest) + " ";
    return s.trim() + " Rupees";
  }
});
