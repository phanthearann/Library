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