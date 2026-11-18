/* CHROMA QUEST — Block Puzzle engine */
(function(){
"use strict";
const SIZE=8,SHAPES=[[[1,1],[1,1]],[[1,1,1],[1,0,0]],[[1,1,1],[0,0,1]],[[1,1,1]],[[1],[1],[1]],[[1,1],[0,1],[0,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[1,0],[1,1]],[[1,1,1],[1,1,1]],[[1],[1],[1],[1]],[[1,1,1,1]],[[1,1],[1,0]],[[1,0,0],[1,1,1]],[[0,1],[1,1],[1,0]],[[1,1,0],[0,1,1]],[[1,1,1],[1,0,1]]],COLORS=["#a56bff","#4de7ff","#ff73d1","#ffc45c","#63e6a7","#6488ff"];
const clone=b=>b.map(r=>r.slice()),emptyBoard=()=>Array.from({length:SIZE},()=>Array(SIZE).fill(null));
function randomPiece(){return{shape:SHAPES[Math.floor(Math.random()*SHAPES.length)].map(r=>r.slice()),color:COLORS[Math.floor(Math.random()*COLORS.length)],used:false};}
const newPieces=()=>[randomPiece(),randomPiece(),randomPiece()];
function fits(board,shape,row,col){for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c]){const y=row+r,x=col+c;if(y<0||x<0||y>=SIZE||x>=SIZE||board[y][x])return false;}return true;}
function place(board,piece,row,col){if(!fits(board,piece.shape,row,col))return null;const next=clone(board);for(let r=0;r<piece.shape.length;r++)for(let c=0;c<piece.shape[r].length;c++)if(piece.shape[r][c])next[row+r][col+c]=piece.color;const rows=[],cols=[];for(let r=0;r<SIZE;r++)if(next[r].every(Boolean))rows.push(r);for(let c=0;c<SIZE;c++)if(next.every(row=>Boolean(row[c])))cols.push(c);rows.forEach(r=>{for(let c=0;c<SIZE;c++)next[r][c]=null;});cols.forEach(c=>{for(let r=0;r<SIZE;r++)next[r][c]=null;});const cells=piece.shape.flat().filter(Boolean).length,cleared=rows.length+cols.length;return{board:next,points:cells+cleared*SIZE*2+(rows.length&&cols.length?20:0),cleared,rows:rows.length,cols:cols.length};}
function anyMove(board,pieces){return pieces.some(p=>!p.used&&Array.from({length:SIZE},(_,r)=>r).some(r=>Array.from({length:SIZE},(_,c)=>c).some(c=>fits(board,p.shape,r,c))));}
window.BlockEngine={SIZE,SHAPES,COLORS,clone,emptyBoard,randomPiece,newPieces,fits,place,anyMove};
})();