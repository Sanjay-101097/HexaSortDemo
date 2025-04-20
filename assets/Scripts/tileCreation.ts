import { _decorator, Component, instantiate, Material, MeshRenderer, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('tileCreation')
export class tileCreation extends Component {
    @property(Material)
    colorMaterials: Material[] = [];

    color: number[] = [];
    originalColor: number[] = [0, 1, 2, 3, 4, 5];

    @property(Prefab)
    hexagonTilePrefab: Prefab = null;

    @property(Prefab)
    circularContainer: Prefab = null;

    NUM_CIRCULAR_CONTAINERS = 8;
    HEXAGON_TILES_PER_CIRCLE = 6;

    public circularContainers: Node[] = [];
    public setArrayData: Array<Array<number>> = [];
    public setIdexArrayData: Array<Array<number>> = [];


    placingCircularContainers() {
        for (let i = 0; i < this.NUM_CIRCULAR_CONTAINERS; i++) {
            const circularContainer = instantiate(this.circularContainer);
            circularContainer.parent = this.node;
            circularContainer.setPosition(0, i * 1.8, 0);
            circularContainer.name = `CircularContainer${i}`;
            this.circularContainers.push(circularContainer);
        }
    }
    tileGenerate(rounds: number, circles: number) {
        for (let k = 0; k < this.NUM_CIRCULAR_CONTAINERS; k++) {
            let setdata = []
            let setIndexData = [];
            for (let j = 0; j < rounds; j++) {
                const selectedColor = this.selectColor();
                const parentNode = this.node.children[k].children[circles].children[j];
                setdata.push(selectedColor);
                setIndexData.push(j);

                for (let i = 0; i < this.HEXAGON_TILES_PER_CIRCLE; i++) {
                    const hexagonTile = instantiate(this.hexagonTilePrefab);
                    this.placeColor(hexagonTile, selectedColor);
                    hexagonTile.parent = parentNode;
                    hexagonTile.setPosition(0, i * 0.3, 0);
                }
            }
            if (setdata.length >= 18){
                this.setIdexArrayData.push(setIndexData);
                this.setArrayData.push(setdata);
            }
        }
        console.log("setArrayData", this.setArrayData);
    }

    placeColor(hexagonTile: Node, colorIndex: number) {
        hexagonTile.getComponent(MeshRenderer).materials[0] = this.colorMaterials[colorIndex];
    }

    selectColor(): number {
        if (this.color.length === 0) {
            this.color = [...this.originalColor];
        }
        const index = Math.floor(Math.random() * this.color.length);
        const selectedColor = this.color[index];
        this.color[index] = this.color[this.color.length - 1];
        this.color.pop();

        return selectedColor;
    }
}


