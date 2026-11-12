const fs=require("fs").promises;
const path=require("path");
const filePath=path.join(__dirname,"..","Data","members.json");

async function readData(){
  try{
    const data=await fs.readFile(filePath,"utf8");
    return JSON.parse(data);
  } catch(error){
    if(error.code==="ENOENT"){
      await fs.writeFile(filePath,"[]");
      return [];
    }
    throw error;
  }

  async function writeData(data){
    await fs.writeFile(filePath,JSON.stringify(data,null,2));
  }


  //get all books
    async function getAll(){
        return await readData();
    }
    async function findById(id){
        const books=await readData();
        return books.find((book)=>book.id===Number(id))||null;
    }
}
async function create(bookData, bus) {
  const books = await readData();

  const name = bookData.name;

  if (typeof name !== "string" || name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }
  const maxId = books.reduce((max, book) => Math.max(max, book.id), 0);

  const newBook = {
    id: maxId + 1,
    name: name.trim(),
    note: bookData.note ?? "",
  };

  books.push(newBook);

  await writeData(books);

  if (bus) {
    bus.emit("created", {
      resource: "books",
      id: newBook.id,
    });
  }

  return newBook;
}