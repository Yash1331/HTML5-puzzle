AFRAME.registerComponent('jigsaw-puzzle', {
  schema: {
    image: {type: 'string'},   // Image for the puzzle
    reward: {type: 'string'},  // Reward image when the puzzle is completed
    pieces: {type: 'int', default: 4}  // Number of puzzle pieces (must be a perfect square for simplicity)
  },

  init: function() {
    this.setupPuzzle();
  },

  setupPuzzle: function() {
    const el = this.el;
    const data = this.data;

    // Add image preview texture to the a-plane
    el.setAttribute('material', {src: data.image, side: 'double'});

    // Create an overlay for the puzzle game
    this.puzzleContainer = document.createElement('div');
    this.puzzleContainer.id = 'puzzle-container';
    this.puzzleContainer.style.position = 'fixed';
    this.puzzleContainer.style.top = '0';
    this.puzzleContainer.style.left = '0';
    this.puzzleContainer.style.width = '100vw';
    this.puzzleContainer.style.height = '100vh';
    this.puzzleContainer.style.display = 'none';  // Hidden initially
    this.puzzleContainer.style.justifyContent = 'center';
    this.puzzleContainer.style.alignItems = 'center';
    this.puzzleContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.puzzleContainer.style.zIndex = '10000';
    document.body.appendChild(this.puzzleContainer);

    // Load the image and prepare puzzle
    this.img = new Image();
    this.img.onload = () => this.createPuzzlePieces();
    this.img.src = data.image;

    // Add event listener to start the puzzle on click
    el.addEventListener('click', () => {
      this.puzzleContainer.style.display = 'flex';
    });
  },

  createPuzzlePieces: function() {
    const numPieces = Math.sqrt(this.data.pieces);
    const containerWidth = 600;  // Arbitrary size for puzzle container
    const containerHeight = 600;
    const pieceWidth = containerWidth / numPieces;
    const pieceHeight = containerHeight / numPieces;

    // Puzzle canvas for rendering pieces
    const puzzleCanvas = document.createElement('canvas');
    puzzleCanvas.width = containerWidth;
    puzzleCanvas.height = containerHeight;
    this.puzzleContainer.appendChild(puzzleCanvas);
    const ctx = puzzleCanvas.getContext('2d');

    this.pieces = [];
    for (let row = 0; row < numPieces; row++) {
      for (let col = 0; col < numPieces; col++) {
        const piece = this.createPuzzlePiece(col, row, pieceWidth, pieceHeight);
        this.pieces.push(piece);
        this.puzzleContainer.appendChild(piece.canvas);
      }
    }
  },

  createPuzzlePiece: function(col, row, pieceWidth, pieceHeight) {
    const pieceCanvas = document.createElement('canvas');
    pieceCanvas.width = pieceWidth;
    pieceCanvas.height = pieceHeight;
    pieceCanvas.style.position = 'absolute';
    pieceCanvas.style.cursor = 'move';
    pieceCanvas.style.left = `${Math.random() * (600 - pieceWidth)}px`;  // Random initial position
    pieceCanvas.style.top = `${Math.random() * (600 - pieceHeight)}px`;

    const ctx = pieceCanvas.getContext('2d');
    // Draw the part of the image that belongs to this piece
    ctx.drawImage(
      this.img,
      col * this.img.width / Math.sqrt(this.data.pieces),
      row * this.img.height / Math.sqrt(this.data.pieces),
      this.img.width / Math.sqrt(this.data.pieces),
      this.img.height / Math.sqrt(this.data.pieces),
      0,
      0,
      pieceWidth,
      pieceHeight
    );

    // Add drag-and-drop functionality
    this.addDragFunctionality(pieceCanvas, col, row, pieceWidth, pieceHeight);

    return {
      canvas: pieceCanvas,
      col: col,
      row: row,
      width: pieceWidth,
      height: pieceHeight
    };
  },

  addDragFunctionality: function(piece, col, row, pieceWidth, pieceHeight) {
    let isDragging = false;
    let startX, startY;

    const startDragging = (e) => {
      isDragging = true;
      const rect = piece.getBoundingClientRect();
      startX = (e.clientX || e.touches[0].clientX) - rect.left;
      startY = (e.clientY || e.touches[0].clientY) - rect.top;
      piece.style.zIndex = '1000';
    };

    const drag = (e) => {
      if (!isDragging) return;
      const containerRect = this.puzzleContainer.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - containerRect.left - startX;
      const y = (e.clientY || e.touches[0].clientY) - containerRect.top - startY;
      piece.style.left = `${Math.max(0, Math.min(x, containerRect.width - pieceWidth))}px`;
      piece.style.top = `${Math.max(0, Math.min(y, containerRect.height - pieceHeight))}px`;
    };

    const stopDragging = () => {
      isDragging = false;
      piece.style.zIndex = '';
      this.checkSnapping(piece, col, row, pieceWidth, pieceHeight);
    };

    piece.addEventListener('mousedown', startDragging);
    piece.addEventListener('touchstart', startDragging, { passive: false });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
  },

  checkSnapping: function(piece, col, row, pieceWidth, pieceHeight) {
    const containerRect = this.puzzleContainer.getBoundingClientRect();
    const x = parseFloat(piece.style.left);
    const y = parseFloat(piece.style.top);
    const expectedX = col * pieceWidth;
    const expectedY = row * pieceHeight;

    if (Math.abs(x - expectedX) < 10 && Math.abs(y - expectedY) < 10) {
      piece.style.left = `${expectedX}px`;
      piece.style.top = `${expectedY}px`;
      this.checkCompletion();
    }
  },

  checkCompletion: function() {
    const allSnapped = this.pieces.every(piece => {
      const x = parseFloat(piece.canvas.style.left);
      const y = parseFloat(piece.canvas.style.top);
      const expectedX = piece.col * piece.width;
      const expectedY = piece.row * piece.height;
      return Math.abs(x - expectedX) < 10 && Math.abs(y - expectedY) < 10;
    });

    if (allSnapped) {
      alert('Congratulations! You solved the puzzle!');
      this.showReward();
    }
  },

  showReward: function() {
    const rewardImage = document.createElement('img');
    rewardImage.src = this.data.reward;
    rewardImage.style.position = 'fixed';
    rewardImage.style.top = '50%';
    rewardImage.style.left = '50%';
    rewardImage.style.transform = 'translate(-50%, -50%)';
    rewardImage.style.maxWidth = '90vw';
    rewardImage.style.maxHeight = '90vh';
    rewardImage.style.zIndex = '10000';
    document.body.appendChild(rewardImage);

    setTimeout(() => {
      rewardImage.remove();
    }, 5000);
  }
});
