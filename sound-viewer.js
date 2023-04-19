class SoundViewer extends HTMLElement {
  sound = undefined;
  waveSpan = undefined;
  maxSize = 100;
  AUDIO_STATE = {
    STOP: 0,
    PLAYING: 1,
    PAUSE: 2,
    ERROR: 10,
  };
  static observedAttributes = ["disabled"];

  constructor() {
    // コンストラクターでは常に super を最初に呼び出してください
    super();
    this.shadow = this.attachShadow({ mode: "closed" }); // 'this.shadowRoot' を設定して返す
  }
  connectedCallback() {
    this.render();
    // this.setAudioFile = this.#setAudioFile;
  }
  attributeChangedCallback(name, oldValue, newValue) {}

  // 初期値を設定するものがあればここで初期値を設定したい
  #init() {
    this.#setVolume(50);
  }
  render() {
    // 外部スタイルシートをシャドウ DOM に適用
    const linkElem = document.createElement("link");
    linkElem.setAttribute("rel", "stylesheet");
    linkElem.setAttribute("href", "sound-viewer.css");

    // ファイルを読み込む機能を追加
    this.#createLoadFileElement();

    // hover
    const mainDiv = document.createElement("div");
    mainDiv.classList.add("main-container");

    // 波形要素を作成
    const canvasDiv = document.createElement("div");
    canvasDiv.classList.add("canvas-container");
    this.#drawing.canvasElement = canvasDiv;

    mainDiv.appendChild(canvasDiv);
    // 操作盤を追加
    this.#createOperationElement(mainDiv);

    this.#init();

    this.shadow.appendChild(mainDiv);
    // 生成された要素をシャドウ DOM に添付
    this.shadow.appendChild(linkElem);
  }

  #setVolume = (volume) => {
    // TODO 100がハードコードしているが本当にいいか考える
    // TODO 初期値を合わせる
    this.#audio.setVolume(volume / 100);
    this.style.setProperty("--volume", `${volume / 100}`);
  };

  #createOperationElement = (mainDiv) => {
    // TODO 操作盤固定機能を追加する
    // 上部操作部分
    const divEleTop = document.createElement("div");
    divEleTop.classList.add("top-operation-container");
    divEleTop.classList.add("operation-container");

    // 下部操作部分
    const divEleBottom = document.createElement("div");
    divEleBottom.classList.add("bottom-operation-container");
    divEleBottom.classList.add("operation-container");

    // 操作ボタン用div
    const bottomOperationDiv = document.createElement("div");
    bottomOperationDiv.classList.add("bottom-operation-btn-container");

    // 操作ボタン追加
    const playBtn = document.createElement("span");
    // playBtn.type = "button";
    // playBtn.value = "再生";
    playBtn.classList.toggle("play-btn");
    playBtn.classList.add("operation-btn");
    // TODO 音声の再生状態と絡めてクラスを追加させる方が良い
    playBtn.addEventListener("click", (e) => {
      playBtn.classList.toggle("play-btn");
      playBtn.classList.toggle("pause-btn");
      if (this.#audio.isState === this.AUDIO_STATE.PLAYING) {
        this.#audio.pause();
      } else {
        this.#audio.play();
        this.#drawing.seekBarDraw();
      }
    });
    bottomOperationDiv.appendChild(playBtn);

    const stopBtn = document.createElement("span");
    stopBtn.classList.add("stop-btn");
    stopBtn.classList.add("operation-btn");

    stopBtn.addEventListener("click", (e) => {
      this.#audio.stop();
      // console.log(this.#drawing.leftData);
      // console.log(this.#drawing.rightData);
    });
    bottomOperationDiv.appendChild(stopBtn);

    // 再生速度変換
    const playbackRateBtn = document.createElement("span");
    playbackRateBtn.classList.add("operation-btn");
    playbackRateBtn.classList.add("playbackRate-btn");
    let aaa = -1;
    let sss = [0.1, 0.5, 1, 1.5, 2, 3, 4, -1];
    playbackRateBtn.addEventListener("click", (e) => {
      aaa++;
      aaa %= sss.length;
      this.#audio.audioObj.playbackRate = sss[aaa];
    });
    bottomOperationDiv.appendChild(playbackRateBtn);

    // 音量
    const volumeDiv = document.createElement("div");
    volumeDiv.classList.add("volume-container");
    volumeDiv.classList.add("operation-btn");

    const speakerLeftDiv = document.createElement("div");
    speakerLeftDiv.classList.add("speaker");
    volumeDiv.appendChild(speakerLeftDiv);

    // TODO 無駄に要素に入れているので変更したい
    const speakerRightContainer = document.createElement("div");
    speakerRightContainer.classList.add("speaker-volume-container");

    const speakerRightDiv = document.createElement("div");
    speakerRightDiv.classList.add("speaker-volume");
    speakerRightContainer.appendChild(speakerRightDiv);
    volumeDiv.appendChild(speakerRightContainer);

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = 0;
    volumeSlider.max = 100;
    volumeSlider.step = 1;
    volumeSlider.addEventListener("input", (e) => {
      this.#setVolume(e.target.value);
    });
    volumeSlider.value = 50;
    volumeSlider.classList.add("volume-slider");

    volumeDiv.appendChild(volumeSlider);
    bottomOperationDiv.appendChild(volumeDiv);

    // 追加
    // this.shadow.appendChild(divEleTop);
    // this.shadow.appendChild(divEleBottom);
    divEleBottom.appendChild(bottomOperationDiv);

    mainDiv.appendChild(divEleTop);
    mainDiv.appendChild(divEleBottom);
  };

  // TODO ドラッグ&ドロップでもできるように対応する
  // TODO Light DOMから読み込み機能をつけるかどうかを判断する属性を導入する
  // TODO アイコン化させる
  #createLoadFileElement = () => {
    // 読み込み時の実行する関数
    const onLoad = (data) => {
      // this.#setAudioFile(data.target.result);
      // console.log(data);
      let url = URL.createObjectURL(new Blob([data.target.result]));
      this.#audio.audioContext.decodeAudioData(data.target.result, (buffer) => {
        this.#audio.load2(buffer, url);
      });
    };

    // TODO 外からアトリビュートの設定で設定できるようにする
    // wavファイルを読みこむ部分
    const uploadBtn = document.createElement("input");
    uploadBtn.type = "file";
    uploadBtn.accept = "audio/wav,audio/mp3";
    uploadBtn.addEventListener("change", (e) => {
      if (this.#audio.audioContext === undefined) this.#audio.init();
      let fileReader = new FileReader();
      const file = e.composedPath()[0].files[0];

      fileReader.onload = onLoad;
      fileReader.readAsArrayBuffer(file);
    });
    this.shadow.appendChild(uploadBtn);
  };

  // #setAudioFile = (arrayBuffer) => {
  //   if (this.#audio.audioContext === undefined) this.#audio.init();
  //   try {
  //     const view = new DataView(arrayBuffer);

  //     // TODO arraybufferかどうかを知りたいだけなので以下の部分をtryに入れる必要がないので変更したい
  //     const [readLeftData, readRightData] = this.#audio.read(view);
  //     if (readLeftData === undefined) {
  //       alert("非対応のwavファイルです");
  //       return;
  //     }

  //     this.#audio.load(
  //       URL.createObjectURL(new Blob([arrayBuffer], { type: "audio/wav" }))
  //     );

  //     this.#drawing.init();
  //     this.#drawing.setLeftData(readLeftData);
  //     this.#drawing.setRightData(readRightData);
  //   } catch {
  //     alert("ArrayBufferのデータをセットしてください。");
  //     return;
  //   }
  // };

  // TODO GainNodeを追加する(音量)
  // TODO StereoPannerNodeを追加(右耳から聞こえるようにするか等)
  // TODO https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics 空間オーディオ(StereoPannerNodeか選択させる？)
  // TODO BiquadFilterNodeを追加(フィルタ)
  // TODO 再生終了時の挙動について
  // TODO ConvolverNodeを追加する(インパルス応答を読み込ませる形)
  // TODO Audio classのpreservesPitch追加する
  // TODO Audio classのplaybackRateを追加する
  // TODO Audio classのloopを追加する（ループするボタンを追加）
  // TODO mp3に対応する(優先度は低い)
  // audio関連の処理
  #audio = {
    samplingRate: undefined,
    bitRate: undefined,
    channel: undefined,
    isState: this.AUDIO_STATE.STOP,
    audioContext: undefined,
    audioSource: undefined,
    audioObj: undefined,

    /**
     * 初期化を行う関数
     */
    init: () => {
      this.#audio.isState = this.AUDIO_STATE.STOP;
      this.#audio.audioContext =
        new AudioContext() ||
        new (window.AudioContext || window.webkitAudioContext)();
    },

    load2: async (buffer, file) => {
      if (this._audioSource !== undefined) {
        this._audioSource.disconnect();
      }
      // audio elementを作成
      this.#setVolume(50);
      this.#audio.source = this.#audio.audioContext.createBufferSource();
      this.#audio.source.buffer = buffer;
      const [readLeftData, readRightData] = await this.#audio.read2(buffer);
      // console.log(this.#audio.source);
      this.#audio.samplingRate = this.#audio.source.buffer.sampleRate;
      this.#drawing.init();
      this.#drawing.setLeftData(readLeftData);
      this.#drawing.setRightData(readRightData);
      this.#audio.audioObj = new Audio(file);

      console.log(this.#audio.samplingRate);
      // console.log(this.#audio.audioObj);

      // connect the AudioBufferSourceNode to the
      // destination so we can hear the sound
      this.#audio.source.connect(this.#audio.audioContext.destination);
      // start the source playing
      // console.log(this.#audio.source);
      // this.#audio.source.start();
    },

    read2: async (buffer) => {
      let left = undefined;
      let right = undefined;
      if (buffer.numberOfChannels === 1) {
        left = buffer.getChannelData(0);
      } else {
        left = buffer.getChannelData(0);
        right = buffer.getChannelData(1);
        this.#drawing.waveExpansion(right);
      }
      this.#drawing.waveExpansion(left);
      return [left, right];
    },

    /**
     * 音声ファイルを読み込んで再生準備する関数
     * @param {filepath} data 音声ファイルのpath
     */
    load: async (file) => {
      if (this._audioSource !== undefined) {
        this._audioSource.disconnect();
      }
      // audio elementを作成
      this.#audio.audioObj = new Audio(file);
      this.#setVolume(50);

      // audio elementのaudio nodeを作成
      this.#audio.audioSource = new MediaElementAudioSourceNode(
        this.#audio.audioContext,
        { mediaElement: this.#audio.audioObj }
      );
      // 再生先を接続
      // createAnalyserを使うと色々調査できるっぽい
      // let test = this.#audio.audioSource.decodeAudioData();

      this.#audio.audioSource.connect(this.#audio.audioContext.destination);
    },
    /**
     * 音声再生
     */
    play: () => {
      if (this.#audio.isState === this.AUDIO_STATE.PLAYING) return;
      this.#audio.audioObj.play();
      console.log(this.#audio.audioObj.duration);
      // this.#audio.source.start();
      // this.#audio.audioContext.resume();
      this.#audio.isState = this.AUDIO_STATE.PLAYING;
      // var drawVisual = requestAnimationFrame(draw);
    },

    /**
     * 再生一時停止
     */
    pause: () => {
      this.#audio.audioObj.pause();
      // this.#audio.audioContext.resume();
      this.#audio.isState = this.AUDIO_STATE.PAUSE;
    },

    /**
     * 再生停止
     */
    stop: () => {
      this.#audio.audioObj.pause();
      this.#audio.audioObj.currentTime = 0;
      this.#audio.isState = this.AUDIO_STATE.STOP;
    },

    currentTime: () => {
      // console.log("this.#audio.audioObj.currentTime");
      // TODO 念の為入れているがおそらくいらなくなる
      if (this.#audio.audioObj === undefined) return 0;
      // console.log(this.#audio.audioObj.duration);
      // console.log(this.#audio.audioObj.currentTime);
      // console.log(this.#audio.samplingRate);
      return this.#audio.audioObj.currentTime;
    },
    /**
     *
     * @param {Number} volume 音量(0 ~ 1の間の数値)
     */

    setVolume: (volume) => {
      // TODO 変更したい（判定をなしにできるように）
      if (this.#audio.audioObj) this.#audio.audioObj.volume = volume;
    },

    // /**
    //  * wavファイルを読み込み関数
    //  * @param {DataView} view ArrayBufferを取得できるクラス
    //  * @returns {bool}
    //  * true  : 読み込み成功
    //  * false : 読み込み失敗
    //  */
    // read: (view) => {
    //   // 文字列を読み取る関数
    //   const readString = (view, offset, length) => {
    //     let text = "";
    //     for (let i = 0; i < length; i++) {
    //       text += String.fromCharCode(view.getUint8(offset + i));
    //     }
    //     return text;
    //   };

    //   // 16bit 1channel
    //   const read16bitMonoPCM = (view, offset, length) => {
    //     let output = [];
    //     for (let i = 0; i < length / 2; i++) {
    //       const input = view.getInt16(offset + i * 2, true);
    //       output[i] = (parseFloat(input) / parseFloat(32768)) * this.maxSize;
    //       if (output[i] > this.maxSize) output[i] = this.maxSize;
    //       else if (output[i] < -this.maxSize) output[i] = -this.maxSize;
    //     }
    //     return [output, undefined];
    //   };

    //   // 16bit 2channel
    //   const read16bitStereoPCM = (view, offset, length) => {
    //     let leftOutput = [];
    //     let rightOutput = [];
    //     for (let i = 0; i < length / 4; i++) {
    //       const left = view.getInt16(offset + i * 4, true);
    //       const right = view.getInt16(offset + i * 4 + 2, true);
    //       leftOutput[i] = (parseFloat(left) / parseFloat(32768)) * this.maxSize;
    //       rightOutput[i] =
    //         (parseFloat(right) / parseFloat(32768)) * this.maxSize;
    //       if (leftOutput[i] > this.maxSize) leftOutput[i] = this.maxSize;
    //       else if (leftOutput[i] < -this.maxSize) leftOutput[i] = -this.maxSize;
    //       if (rightOutput[i] > this.maxSize) rightOutput[i] = this.maxSize;
    //       else if (rightOutput[i] < -this.maxSize)
    //         rightOutput[i] = -this.maxSize;
    //     }
    //     return [leftOutput, rightOutput];
    //   };

    //   // 8bit 1channel
    //   const read8bitMonoPCM = (view, offset, length) => {
    //     let output = [];
    //     for (let i = 0; i < length; i++) {
    //       const input = view.getInt8(offset + i, true);
    //       output[i] = (input / 128) * this.maxSize;
    //       if (output[i] > this.maxSize) output[i] = this.maxSize;
    //       else if (output[i] < -this.maxSize) output[i] = -this.maxSize;
    //     }
    //     return [output, undefined];
    //   };

    //   // 8bit 2channel
    //   const read8bitStereoPCM = (view, offset, length) => {
    //     let leftOutput = [];
    //     let rightOutput = [];
    //     for (let i = 0; i < length / 2; i++) {
    //       const left = view.getInt8(offset + i * 2, true);
    //       const right = view.getInt8(offset + i * 2 + 1, true);
    //       leftOutput[i] = (left / 128) * this.maxSize;
    //       rightOutput[i] = (right / 128) * this.maxSize;
    //       if (leftOutput[i] > this.maxSize) leftOutput[i] = this.maxSize;
    //       else if (leftOutput[i] < -this.maxSize) leftOutput[i] = -this.maxSize;
    //       if (rightOutput[i] > this.maxSize) rightOutput[i] = this.maxSize;
    //       else if (rightOutput[i] < -this.maxSize)
    //         rightOutput[i] = -this.maxSize;
    //     }
    //     return [leftOutput, rightOutput];
    //   };

    //   // TODO 各ヘッダの結果を見てエラーを返すようにする
    //   // RIFFヘッダ
    //   const riffHeader = readString(view, 0, 4);
    //   const fileSize = view.getUint32(4, true);

    //   // WAVEヘッダ
    //   const waveHeader = readString(view, 8, 4);

    //   // fmtチャンク
    //   const fmt = readString(view, 12, 4);
    //   const fmtChunkSize = view.getUint32(16, true); // fmtチャンクのバイト数
    //   const fmtID = view.getUint16(20, true); // フォーマットID(非圧縮PCMなら1)

    //   // チャンネル数
    //   this.#audio.channel = view.getUint16(22, true);

    //   // サンプリングレート
    //   this.#audio.samplingRate = view.getUint32(24, true);
    //   const dataSpeed = view.getUint32(28, true); // バイト/秒 1秒間の録音に必要なバイト数(サンプリングレート*チャンネル数*ビットレート/8)
    //   const blockSize = view.getUint16(32, true); // ブロック境界、(ステレオ16bitなら16bit*2=4byte)

    //   // ビットレート
    //   this.#audio.bitRate = view.getUint16(34, true);

    //   let exOffset = 0; //拡張パラメータ分のオフセット
    //   if (fmtChunkSize > 16) {
    //     const extendedSize = fmtChunkSize - 16; // 拡張パラメータのサイズ
    //     exOffset = extendedSize;
    //   }

    //   // dataチャンク
    //   const data = readString(view, 36 + exOffset, 4);
    //   // 波形データのバイト数
    //   const dataChunkSize = view.getUint32(40 + exOffset, true);
    //   let readPCM;
    //   if (this.#audio.channel === 1 && this.#audio.bitRate === 16) {
    //     readPCM = read16bitMonoPCM;
    //   } else if (this.#audio.channel === 2 && this.#audio.bitRate === 16) {
    //     readPCM = read16bitStereoPCM;
    //   } else if (this.#audio.channel === 1 && this.#audio.bitRate === 8) {
    //     readPCM = read8bitMonoPCM;
    //   } else if (this.#audio.channel === 2 && this.#audio.bitRate === 8) {
    //     readPCM = read8bitStereoPCM;
    //   } else return [undefined, undefined];
    //   // let leftData;
    //   // let rightData;
    //   // [leftData, rightData] = readPCM(
    //   //   view,
    //   //   44 + exOffset,
    //   //   dataChunkSize + exOffset
    //   // ); // 波形データを受け取る
    //   // this.#drawing.init();
    //   // this.#drawing.setLeftData(leftData);
    //   // this.#drawing.setRightData(rightData);
    //   // console.log(this.#audio.samplingRate);
    //   return readPCM(view, 44 + exOffset, dataChunkSize + exOffset);
    // },
  };

  // TODO 長い音声に対応するためにcanvasを連結させる
  // 描画関連
  #drawing = {
    canvasElement: undefined,
    leftData: undefined,
    rightData: undefined,
    seekBarCanvas: undefined,
    leftCanvas: undefined,
    rightCanvas: undefined,
    // seekBarCtx: undefined,
    peakLength: 256,
    offset: 5,
    scale: undefined,
    init: () => {
      if (this.#drawing.seekBarCanvas !== undefined) return;
      this.#drawing.seekBarCanvas = document.createElement("canvas");
      this.#drawing.seekBarCanvas.classList.add("main-canvas");
      this.#drawing.seekBarCanvas.classList.add("canvas-width");
      this.#drawing.seekBarCanvas.width = 2000;
      this.#drawing.canvasElement.appendChild(this.#drawing.seekBarCanvas);

      this.waveSpan = document.createElement("span");
      this.waveSpan.classList.add("wave-position");
      this.#drawing.canvasElement.appendChild(this.waveSpan);

      // this.#drawing.seekBarCtx = this.#drawing.seekBarCanvas.getContext("2d");
    },

    waveExpansion: (data) => {
      for (let i = 0; i < data.length; ++i) {
        data[i] *= this.maxSize;
      }
      return data;
    },

    getPeak: (data) => {
      const max = (x, y) => {
        if (x < y) return y;
        return x;
      };
      const min = (x, y) => {
        if (x > y) return y;
        return x;
      };
      let peakData = [];
      let count = 0;
      let flag = true;
      while (count < data.length) {
        let size = 0;
        let peak = flag === true ? -this.maxSize : this.maxSize;
        while (size < this.#drawing.peakLength && count < data.length) {
          const chnum = flag === true ? max : min;
          peak = chnum(peak, data[count]);
          size++;
          count++;
        }
        peakData.push(peak);
        flag = !flag;
      }

      return peakData;
    },
    setLeftData: (data) => {
      if (data === undefined) return;
      this.#drawing.leftData = this.#drawing.getPeak(data);

      if (this.#drawing.leftCanvas === undefined) {
        const leftCanvas = document.createElement("canvas");
        leftCanvas.classList.add("wave-canvas");
        leftCanvas.classList.add("canvas-width");
        leftCanvas.classList.add("wave-left");
        // leftCanvas.width = data.length + this.#drawing.offset * 2;
        leftCanvas.width = 2000;
        leftCanvas.height = (this.maxSize + this.#drawing.offset) * 2;
        this.#drawing.leftCanvas = leftCanvas;
        this.waveSpan.appendChild(leftCanvas);
      }
      this.#drawing.seekBarDraw();
      this.#drawing.waveDraw(this.#drawing.leftCanvas, this.#drawing.leftData);
    },
    // TODO undefindが入ってきた時にcanvasを削除する処理追加
    setRightData: (data) => {
      if (data === undefined && this.#drawing.rightCanvas !== undefined) {
        this.#drawing.rightCanvas = undefined;
        // console.log(this.waveSpan)
        this.waveSpan.removeChild(this.waveSpan.lastElementChild);
        return;
      } else if (data === undefined) {
        return;
      }

      this.#drawing.rightData = this.#drawing.getPeak(data);
      if (this.#drawing.rightCanvas === undefined) {
        const rightCanvas = document.createElement("canvas");
        rightCanvas.classList.add("wave-canvas");
        rightCanvas.classList.add("canvas-width");
        rightCanvas.classList.add("wave-right");
        rightCanvas.width = 2000;
        rightCanvas.height = (this.maxSize + this.#drawing.offset) * 2;
        this.#drawing.rightCanvas = rightCanvas;

        this.waveSpan.appendChild(rightCanvas);
      }
      this.#drawing.waveDraw(
        this.#drawing.rightCanvas,
        this.#drawing.rightData
      );
    },
    waveDraw: (cnavas, data) => {
      const N = data.length;
      const ctx = cnavas.getContext("2d");
      if (this.#drawing.scale === undefined)
        this.#drawing.scale = cnavas.width / data.length;
      // const scale = cnavas.width / data.length;
      /*
      ----------------------------> x
      |
      |
      |
      |
      ↓
      y
      canvasは↑の形で座標を取るので、変換する必要がある。
      初めに+, - となっているので - 基準線を行い、全てのy軸を負の値にする。
      その後、符号を反転させる
      */
      ctx.clearRect(0, 0, cnavas.width, cnavas.height);
      ctx.beginPath();
      ctx.moveTo(
        this.#drawing.offset,
        this.#drawing.coordinateTransformation(
          data[0],
          this.maxSize + this.#drawing.offset
        )
      );
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 0, 255, 1)";
      // for (let idx = 1; idx < data.length; ++idx) {
      for (let idx = 1; idx < N; ++idx) {
        ctx.lineTo(
          idx * this.#drawing.scale + this.#drawing.offset,
          this.#drawing.coordinateTransformation(
            data[idx],
            this.maxSize + this.#drawing.offset
          )
        );
      }
      ctx.stroke();
    },
    coordinateTransformation: (y, baseLine) => {
      y -= baseLine;
      return -y;
    },

    seekBarDraw: () => {
      if (this.#audio.isState === this.AUDIO_STATE.PLAYING)
        requestAnimationFrame(this.#drawing.seekBarDraw);
      const currentTime = this.#audio.currentTime();
      const ctx = this.#drawing.seekBarCanvas.getContext("2d");
      ctx.clearRect(
        0,
        0,
        this.#drawing.seekBarCanvas.width,
        this.#drawing.seekBarCanvas.height
      );
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      const scale = this.#drawing.scale === undefined ? 0 : this.#drawing.scale;
      const x =
        this.#drawing.calcCanvasPosition(currentTime) * scale +
        this.#drawing.offset;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.maxSize * 2);
      ctx.stroke();
    },
    calcCanvasPosition: (num) => {
      return (num * this.#audio.samplingRate) / this.#drawing.peakLength;
    },
  };
}

customElements.define("sound-viewer", SoundViewer);
