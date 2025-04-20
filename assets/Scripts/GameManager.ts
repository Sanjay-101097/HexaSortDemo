
import { _decorator, Camera, ColliderComponent, Component, EventTouch, geometry, input, Input, PhysicsSystem, setDisplayStats, tween, Vec3,Node, AudioClip, AudioSource } from 'cc';
import { tileCreation } from './tileCreation';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(tileCreation)
    tileCreation: tileCreation = null;

    @property(Node)
    Canvas: Node = null;
    
    @property(AudioClip)
    AudioClips: AudioClip[] = [];

    @property(Camera)
    readonly cameraCom!: Camera;


    private _ray: geometry.Ray = new geometry.Ray();
    public static score: number = 0;
    private _touchStartX = 0;
    private _initialAngles: number[] = [];
    private rotatingNodeArry: Node[] = [];
    private setsData;
    private setIndexData;
    private count : number = 0;
    audioSource: AudioSource;
    _playIndex: number = 0;
    repeatCount: number = 10;
    playDuration: number = 0.1;


    protected onLoad(): void {
        this.tileCreation.placingCircularContainers();
        this.tileCreation.tileGenerate(18, 0);
        this.tileCreation.tileGenerate(12, 1);
        this.tileCreation.tileGenerate(6, 2);
        setDisplayStats(false);

    }

    start() {
        this.setsData = this.tileCreation.setArrayData;
        this.setIndexData = this.tileCreation.setIdexArrayData;
        this.audioSource = this.node.getComponent(AudioSource);
    }
    onEnable() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

    }
    
    private enable: boolean = false;
    onTouchStart(event: EventTouch) {
        const touch = event.touch!;
        this._touchStartX = touch.getLocationX();
        this.cameraCom.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray);
        this.rotatingNodeArry = [];
        this._initialAngles = [];
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            raycastResults.sort((a, b) => a.distance - b.distance);
            for (let i = 0; i < raycastResults.length; i++) {
                const item = raycastResults[i];
                if (item.collider.node.name == 'Circle1') {
                    this.enable = true;
                    this.rotatingNodeArry.push(item.collider.node);
                    console.log("C", raycastResults[i])
                    this._initialAngles.push(item.collider.node.eulerAngles.y);
                    return;

                }

            }
        } else {
            this.rotatingNodeArry = [];
            this._initialAngles = [];
            let circularContainers = this.tileCreation.circularContainers
            for (let i = 0; i < circularContainers.length; i++) {
                this.rotatingNodeArry.push(circularContainers[i].children[0]);
                this._initialAngles.push(circularContainers[i].children[0].eulerAngles.y);
                this.enable = true;
            }

        }
    }

    initAngle: number;
    sound:boolean = true;
    onTouchMove(event: EventTouch) {
        if(this.sound == true){
            this.audioSource.clip = this.AudioClips[0];
            this.sound = false;
            this.playAudioMultipleTimes();
            
        }
        if (this.enable) {
            const touch = event.touch!;
            const deltaX = (touch.getLocationX() - this._touchStartX) / 2;

            for (let i = 0; i < this.rotatingNodeArry.length; i++) {
                const item = this.rotatingNodeArry[i];
                this.initAngle = this._initialAngles[i];
                item.setRotationFromEuler(0, this.initAngle + deltaX, 0);
                if(this.rotatingNodeArry.length > 1){
                    item.parent.children[1]?.setRotationFromEuler(0, this.initAngle + deltaX, 0);
                    item.parent.children[2]?.setRotationFromEuler(0, this.initAngle + deltaX, 0);
                }
            }
        }
    }

    private onTouchEnd(event: EventTouch) {
        this.sound = true;
        this.enable = false;
        const touch = event.touch!;
        const deltaX = touch.getLocationX() - this._touchStartX;
        const shifted = new Set<number>();
        this.rotatingNodeArry.forEach((item, i) => {
            let finalangle = item.eulerAngles.y;


            finalangle = ((finalangle % 360) + 360) % 360;

            finalangle = Math.round(finalangle / 20) * 20;

            item.setRotationFromEuler(0, finalangle, 0);
            if(this.rotatingNodeArry.length > 1){
                item.parent.children[1]?.setRotationFromEuler(0, finalangle, 0);
                item.parent.children[2]?.setRotationFromEuler(0, finalangle, 0);
            }
            let initialAngle = ((this._initialAngles[i] % 360) + 360) % 360;

            let diff = ((finalangle - initialAngle + 360) % 360);
            if(diff>0){
                this.count += 1;
            }
            if (diff > 180) diff -= 360;
            let shiftNum = Math.round(Math.abs(diff / 20));
            let shiftType = diff >= 0 ? 1 : 0;


            let index = this.tileCreation.circularContainers.indexOf(item.parent);
            if (!shifted.has(index)) {
                this.ShiftArray(index, shiftNum, shiftType);
                shifted.add(index);
            }
        });

        let matchingIndexes = this.getMatchingIndices(this.setsData);
        if(matchingIndexes.length > 0){
            this.FadingAnimation(matchingIndexes);
        }
        
        let updatedShiftSet = this.shiftUpValues(this.setsData);
        if(updatedShiftSet.length > 0){
            for(let i=0; i< updatedShiftSet.length; i++){
                this.FallingAnimation(updatedShiftSet[i]);
            }
        }
        if(this.count > 15){
            this.Canvas.active = true;
            input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        }
    }

    FallingAnimation(array) {
        let circularContainers = this.tileCreation.circularContainers;
        
        
        const initrow = array[0][0];
        const initcol = this.setIndexData[initrow][array[0][1]];
        const finalrow = array[1][0];
        const finalcol = this.setIndexData[finalrow][array[1][1]];
        const fromNode = circularContainers[initrow].children[0].children[initcol];
        const toNode = circularContainers[finalrow].children[0].children[finalcol];
        let shiftSet = fromNode;

        let hexaItems = [...shiftSet.children];
        hexaItems.forEach((element,i) => {

            const worldPos = element.getWorldPosition();

            element.removeFromParent(); 
            toNode.addChild(element);   
    
            const localPos = new Vec3();
            toNode.inverseTransformPoint(localPos, worldPos);
            element.setPosition(localPos);
    
            
            element.setPosition(element.position.x, i * 0.3, element.position.z);
        });



        
        
    }

    FadingAnimation(arrayindex) {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        let circularContainers = this.tileCreation.circularContainers
        for (let i = 0; i < arrayindex.length; i++) {
            for(let j = 0; j < this.setIndexData.length; j++) {
                let idx = this.setIndexData[j][arrayindex[i]];
                let item = circularContainers[j].children[0].children[idx];
                this.items.push(item);
            }
        }
        this.tweenFunc();
    }
    items= []
    tweenFunc() {
        const processItem = (i) => {
            if (i < 0) {
                this.items =[];
                input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
                input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
                input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
                return;
            }
            const children = this.items[i].children;
            if (children.length == 0) {
                processItem(i - 1); 
                return;
            }
            const animateChild = (index) => {
                if (index < 0) {
                    processItem(i - 1); 
                    return;
                }
                const child = children[index];

                tween(child)
                    .to(0.05, { scale: new Vec3(0.2, 0.2, 0.2) }) 
                    .call(() => {
                        child.destroy(); 
                        animateChild(index - 1);
                        this.node.getComponent(AudioSource).playOneShot(this.AudioClips[1]);
                    })
                    .start();
            };
            animateChild(children.length - 1);
        };
        processItem(this.items.length - 1);
        
    }

    ShiftArray(index: number, k: number, shiftType): number[] {
        const n = this.setsData[index].length;
        if (n === 0) return;

        k = k % n; 
        if (shiftType === 0) {
            const removed = this.setsData[index].splice(0, k);
            this.setsData[index].push(...removed);
            const removedIndex = this.setIndexData[index].splice(0, k);
            this.setIndexData[index].push(...removedIndex);
        } else {
            const removed = this.setsData[index].splice(n - k, k);
            this.setsData[index].unshift(...removed);
            const removedIndex = this.setIndexData[index].splice(n - k, k);
            this.setIndexData[index].unshift(...removedIndex);
        }

    }

    getMatchingIndices(matrix: number[][]): number[] {
        const rowCount = matrix.length;
        if (rowCount === 0) return [];
    
        const colCount = matrix[0].length;
        const matchingIndices: number[] = [];
    
        for (let col = 0; col < colCount; col++) {
            const value = matrix[0][col];
            let allMatch = true;
            for (let row = 1; row < rowCount; row++) {
                if (matrix[row][col] !== value) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                matchingIndices.push(col);
                for (let row = 0; row < rowCount; row++) {
                    matrix[row][col] = -1;
                }
            }
        }
    
        return matchingIndices;
    }


    

    shiftUpValues(matrix: number[][]): number[][][] {
        const rowCount = matrix.length;
        const colCount = matrix[0].length;
        const movementLog: number[][][] = [];
      
        for (let col = 0; col < colCount; col++) {
          let targetRow = -1;
          let sourceRow = -1;
      
          for (let row = 0; row < rowCount; row++) {
            if (matrix[row][col] === -1) {
              targetRow = row;
              break;
            }
          }
      
          if (targetRow !== -1) {
            for (let row = rowCount - 1; row > targetRow; row--) {
              if (matrix[row][col] !== -1) {
                sourceRow = row;
                break;
              }
            }
      
            if (sourceRow !== -1) {
              matrix[targetRow][col] = matrix[sourceRow][col];
              matrix[sourceRow][col] = -1;
              movementLog.push([[sourceRow, col], [targetRow, col]]);
            }
          }
        }
      
        return movementLog;
      }


    OnStartButtonClick(){
        window.open("https://play.google.com/store/apps/details?id=com.gamebrain.hexasort", "HexaSort");
    }
        
    playAudioMultipleTimes() {
        if (!this.audioSource || !this.audioSource.clip) {
            return;
        }

        const playOnce = () => {
            if (this._playIndex >= this.repeatCount || this.sound){
                this._playIndex = 0;
                return;
            } 

            this.audioSource.play();

            this.scheduleOnce(() => {
                this.audioSource.stop();

                this._playIndex++;
                playOnce();
            }, this.playDuration);
        };

        playOnce();
    }

      
      



}

