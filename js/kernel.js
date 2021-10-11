
  const canvasParent = document.getElementById('canvas-parent');
  const filter = document.getElementById('filter');
  const gpuEnabled = document.getElementById('gpu-enabled');
  const fpsNumber = document.getElementById('fps-number');
  const noFilter = document.getElementById('no-filter');
  const edgeFilter = document.getElementById('edge-filter');
  const sharpenFilter = document.getElementById('sharpen-filter');
  const blurFilter = document.getElementById('blur-filter');
  const fadeFilter = document.getElementById('fade-filter');
  const pipelineFilter = document.getElementById('pipeline-filter');
  const paramForm = document.getElementById('paramForm');
  var parameter = document.getElementById('parameter');
  paramForm.style.display = "none";
  //sharpen matrix
  var sharpenFilterMatrix = [0,-1,0,-1,5,-1,0,-1,0]
  //edge matrix
  var edgeFilterMatrix = [-1,-1,-1,-1,8,-1,-1,-1,-1]
  //blur matirx
  var blurFilterMatrix = [1/16,1/8,1/16,1/8,1/4,1/8,1/16,1/8,1/16]

  let lastCalledTime = Date.now();
  let fps;
  let delta;
  let dispose = setup();

  gpuEnabled.onchange = () => {
    if (dispose)dispose();
    dispose = setup();
  };

  // validate user custon paramenter input
  function validateUserInput() {
    var param = document.forms["myForm"]["fname"].value;
    var checkParam = param.split(",")
    if(checkParam.length != 9){
      alert("please enter the correct parameter formate\n for example 1,2,3,4,5,6,7,8,9");
    }else{
      for(i=0; i<checkParam.length; i++){
        checkParam[i] = parseFloat(checkParam[i])
      }
      if(blurFilter.checked==true){
        blurFilterMatrix = checkParam
      }else if(edgeFilter.checked==true){
        edgeFilterMatrix = checkParam
      }else if(sharpenFilter.checked==true){
        sharpenFilterMatrix = checkParam
      }
    }
  }

  //allow only one filter to be selected
  function onlyOne(checkbox) {
    var checkboxes = document.getElementsByName('check')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
    //show input for user to input custom parameter
    if(blurFilter.checked==true) {
      paramForm.style.display = "block";
      parameter.value=blurFilterMatrix
    }else if(edgeFilter.checked==true){
      paramForm.style.display = "block";
      parameter.value=edgeFilterMatrix
    }else if(sharpenFilter.checked==true){
      paramForm.style.display = "block";
      parameter.value=sharpenFilterMatrix
    }else{
      paramForm.style.display = "none";
    }
    if(pipelineFilter.checked == true){
      fadeTime = setInterval(function(){
        fadeFilter.checked = true;
        clearInterval(fadeTime);
        sharpenTime = setInterval(function(){
          fadeFilter.checked = false;
          sharpenFilter.checked = true;
          clearInterval(sharpenTime);
          blurTime = setInterval(function(){
            sharpenFilter.checked = false;
            blurFilter.checked = true;
            clearInterval(blurTime);
            edgeTime = setInterval(function(){
              blurFilter.checked = false;
              edgeFilter.checked = true;
              clearInterval(edgeTime);
              noTime = setInterval(function(){
                edgeFilter.checked = false;
                noFilter.checked = true;
                pipelineFilter.checked = false;
                clearInterval(noTime);
              },2000); 
            },2000);
          },2000);
        },2000);
      },2000);
    }
  }

  function setup() {
    let disposed = false;
    const gpu = new GPU({ mode: gpuEnabled.checked ? 'gpu' : 'cpu' });
    // THIS IS THE IMPORTANT STUFF
    const kernel = gpu.createKernel(function (frame, edgeFilter, sharpenFilter, blurFilter, fadeFilter, sharpenFilterMatrix, edgeFilterMatrix, blurFilterMatrix) {
      const pixel = frame[this.thread.y][this.thread.x];
      var col = [0,0,0];
      if (edgeFilter) {
        // for edgefilter
        if (this.thread.y > 0 && this.thread.y < 768-2 && this.thread.x < 1024-2 && this.thread.x >0) {
          const a0 = frame[this.thread.y + 1][this.thread.x - 1];
          const a1 = frame[this.thread.y + 1][this.thread.x    ];
          const a2 = frame[this.thread.y + 1][this.thread.x + 1];
          const a3 = frame[this.thread.y    ][this.thread.x - 1];
          const a4 = frame[this.thread.y    ][this.thread.x    ];
          const a5 = frame[this.thread.y    ][this.thread.x + 1];
          const a6 = frame[this.thread.y - 1][this.thread.x - 1];
          const a7 = frame[this.thread.y - 1][this.thread.x    ];
          const a8 = frame[this.thread.y - 1][this.thread.x + 1];
          for (var i=0; i<3; i++) {       // Compute the convolution for each of red [0], green [1] and blue [2]
            col[i] = a0[i]*edgeFilterMatrix[0] + a1[i]*edgeFilterMatrix[1] + a2[i]*edgeFilterMatrix[2] + a3[i]*edgeFilterMatrix[3] + a4[i]*edgeFilterMatrix[4] + a5[i]*edgeFilterMatrix[5] + a6[i]*edgeFilterMatrix[6] + a7[i]*edgeFilterMatrix[7] + a8[i]*edgeFilterMatrix[8];
          }
          this.color(col[0], col[1], col[2], 1);
        }else{
          this.color(pixel.r, pixel.g, pixel.b, pixel.a);
        }
      }else if(sharpenFilter){
        // for sharpen filter
        if (this.thread.y > 0 && this.thread.y < 768-2 && this.thread.x < 1024-2 && this.thread.x >0) {
          const a0 = frame[this.thread.y + 1][this.thread.x - 1];
          const a1 = frame[this.thread.y + 1][this.thread.x    ];
          const a2 = frame[this.thread.y + 1][this.thread.x + 1];
          const a3 = frame[this.thread.y    ][this.thread.x - 1];
          const a4 = frame[this.thread.y    ][this.thread.x    ];
          const a5 = frame[this.thread.y    ][this.thread.x + 1];
          const a6 = frame[this.thread.y - 1][this.thread.x - 1];
          const a7 = frame[this.thread.y - 1][this.thread.x    ];
          const a8 = frame[this.thread.y - 1][this.thread.x + 1];
          for (var i=0; i<3; i++) {       // Compute the convolution for each of red [0], green [1] and blue [2]
            col[i] = a0[i]*sharpenFilterMatrix[0] + a1[i]*sharpenFilterMatrix[1] + a2[i]*sharpenFilterMatrix[2] + a3[i]*sharpenFilterMatrix[3] + a4[i]*sharpenFilterMatrix[4] + a5[i]*sharpenFilterMatrix[5] + a6[i]*sharpenFilterMatrix[6] + a7[i]*sharpenFilterMatrix[7] + a8[i]*sharpenFilterMatrix[8];
          }
          this.color(col[0], col[1], col[2], 1);
        }else{
          this.color(pixel.r, pixel.g, pixel.b, pixel.a);
        }
      }else if(blurFilter){
        // for blur filter
        if (this.thread.y > 0 && this.thread.y < 768-2 && this.thread.x < 1024-2 && this.thread.x >0) {
          const a0 = frame[this.thread.y + 1][this.thread.x - 1];
          const a1 = frame[this.thread.y + 1][this.thread.x    ];
          const a2 = frame[this.thread.y + 1][this.thread.x + 1];
          const a3 = frame[this.thread.y    ][this.thread.x - 1];
          const a4 = frame[this.thread.y    ][this.thread.x    ];
          const a5 = frame[this.thread.y    ][this.thread.x + 1];
          const a6 = frame[this.thread.y - 1][this.thread.x - 1];
          const a7 = frame[this.thread.y - 1][this.thread.x    ];
          const a8 = frame[this.thread.y - 1][this.thread.x + 1];
          for (var i=0; i<3; i++) {       // Compute the convolution for each of red [0], green [1] and blue [2]
            col[i] = a0[i]*blurFilterMatrix[0] + a1[i]*blurFilterMatrix[1] + a2[i]*blurFilterMatrix[2] + a3[i]*blurFilterMatrix[3] + a4[i]*blurFilterMatrix[4] + a5[i]*blurFilterMatrix[5] + a6[i]*blurFilterMatrix[6] + a7[i]*blurFilterMatrix[7] + a8[i]*blurFilterMatrix[8];
          }
          this.color(col[0], col[1], col[2], 1);
        }else{
          this.color(pixel.r, pixel.g, pixel.b, pixel.a);
        }
      }else if(fadeFilter){
        // for fade filter
        this.color((pixel.r * (this.thread.y + this.thread.x)) / 1024.0,(pixel.g * (this.thread.y * this.thread.x)) / (1024.0 * 1024.0),(pixel.b * (this.thread.y * 2 * this.thread.x)) / (1024.0 * 2),1)
      }
      else {
        this.color(pixel.r, pixel.g, pixel.b, pixel.a);
      }
    }, {
      output: [1024, 768],
      graphical: true,
      tactic: 'precision'
    });
    canvasParent.appendChild(kernel.canvas);
    const videoElement = document.querySelector('video');
    
    function render() {
      if (disposed) {
        return;
      }
      // passing in all the paramenter 
      kernel(videoElement, edgeFilter.checked, sharpenFilter.checked, blurFilter.checked, fadeFilter.checked, sharpenFilterMatrix, edgeFilterMatrix, blurFilterMatrix);
      window.requestAnimationFrame(render);
      calcFPS();
    }

    render();
    return () => {
      canvasParent.removeChild(kernel.canvas);
      gpu.destroy();
      disposed = true;
    };
  }

  function streamHandler(stream) {
    try {
      video.srcObject = stream;
    } catch (error) {
      video.src = URL.createObjectURL(stream);
    }
    video.play();
    console.log("In startStream");
    requestAnimationFrame(render);
  }


  addEventListener("DOMContentLoaded", initialize);

  function calcFPS() {
    delta = (Date.now() - lastCalledTime) / 1000;
    lastCalledTime = Date.now();
    fps = 1 / delta;
    fpsNumber.innerHTML = fps.toFixed(0);
  }