const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const members = require("./members");

async function run() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("=== DATA MEMBERS MANAGEMENT ===");
    console.log("1.  (Create)");
    console.log("2.  (See All)");
    console.log("3.  (Update)");
    console.log("4.  (Delete by ID)");
    console.log("5.  (Clear All)");

    const choice = await rl.question("\n Choice Number  (1-5): ");

    switch (choice.trim()) {
      case "1": {
        // --- 1. CREATE ---
        const name = await rl.question("Name Member: ");
        const phone = await rl.question("Phone Number: ");

        const newMember = await members.create({ name, phone });
        console.log("\nSuccess:", newMember);
        break;
      }

      case "2": {
        // --- 2. READ ALL ---
        break;
      }

      case "3": {
        // --- 3. UPDATE ---
        const updateId = await rl.question("Enter ID to update: ");
        const newName = await rl.question("Enter new Name: ");
        const newPhone = await rl.question("Enter new Phone: ");

        const updatedMember = await members.update(updateId.trim(), {
          name: newName,
          phone: newPhone,
        });
        console.log("\nUpdated successfully:", updatedMember);
        break;
      }

      case "4": {
        // --- 4. DELETE ---
        const deleteId = await rl.question("Enter ID to delete: ");
        const deletedResult = await members.remove(deleteId.trim());
        console.log(`\nDeleted successfully! ID: ${deletedResult.deleted}`);
        break;
      }

      case "5": {
        // --- 5. CLEAR ALL ---
        const confirm = await rl.question("Are you sure you want to delete all data? (y/n): ");
        if (confirm.toLowerCase().trim() === "y") {
          if (members.clearAll) {
            await members.clearAll();
          } else {
            // បើក្នុង members.js មិនទាន់មាន function clearAll
            const fs = require("fs").promises;
            const path = require("path");
            await fs.writeFile(path.join(__dirname, "Data", "members.json"), "[]");
          }
          console.log("\nAll data has been deleted!");
        }
        break;
      }

      default:
        console.log("Invalid choice!");
    }

    // បង្ហាញទិន្នន័យបច្ចុប្បន្នចុងក្រោយជានិច្ច
    console.log("\n--- Member List in JSON ---");
    const all = await members.getAll();
    console.table(all);

  } catch (error) {
    console.error("មានបញ្ហា៖", error.message);
  } finally {
    rl.close();
  }
}

run();