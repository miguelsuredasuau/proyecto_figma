import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Chart, registerables } from 'node_modules/chart.js';
import { DataService } from 'src/app/services/data-service.service';
import { ProjectService } from 'src/app/services/project.service';
import { EventsService } from 'src/app/services/events.service';
import Swal from 'sweetalert2';
Chart.register(...registerables);
declare var bootstrap: any;
@Component({
  selector: 'app-edit-variable',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [ProjectService],
  templateUrl: './edit-variable.component.html',
  styleUrl: './edit-variable.component.scss',
})
export class EditVariableComponent implements OnInit, OnChanges {
  @Input() variableId: any;
  @Input() variableFather: any;
  @Input() editVariable: boolean = false;
  @Input() aux: any;
  @Input() tier: any;
  @ViewChild('exampleModal') miModal!: ElementRef;
  editVariableName: boolean = false;
  editVariableDescription: boolean = false;
  editVariableUnidad: boolean = false;
  variableOperation: any;
  mean: number = 0;
  rate: number = 0;
  min: number = 0;
  max: number = 0;
  stDev: number = 0;
  variableSelect1: any = '#';
  variableSelect2: any = '#';
  variableUnidad!: any;
  isOperation: boolean = false;
  constante: boolean = true;
  variableName!: any;
  @Input() isHidden: boolean = false;
  variableDescription!: any;
  operationType: any = '+';
  closeToogle: boolean = false;
  tempObject = [
    {},
    {
      name: this.variableName,
      description: this.variableDescription,
      constante: this.constante,
      operation: false,
    },
  ];
  operators: any = [
    '+',
    '-',
    '*',
    '/',
    '=',
    '(',
    ')',
    '?',
    ':',
    '==',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    '&',
    '|',
  ];
  @Input() isNewTree: boolean = false;
  calculos: any[] = [];
  disableSend: boolean = true;
  onlyConst: any = [];
  @Input() nodeId!: any;
  @Input() projectId!: any;
  variables: any[] = [];
  simbols: any[] = [
    '=',
    '(',
    ')',
    '?',
    ':',
    '==',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    '&',
    '|',
  ];
  shapeData: any = {
    __zone_symbol__value: { name: 'Normal' },
  };
  showNewEscenario: any[] = [];
  operations: any[] = [];
  sendOperations: any[] = [];
  selectedCalculo: any;
  chart!: any;
  mostrarPopover: boolean = false;
  inputValue: string = '';
  oldType!: boolean;
  @Output() sendDataEvent = new EventEmitter<any>();

  @ViewChild('popover') popover!: ElementRef;

  @Output() deleteDataEvent = new EventEmitter<any>();
  @Output() deleteNode = new EventEmitter<any>();
  @Output() editDataEvent = new EventEmitter<any>();
  @Output() hiddenDataEvent = new EventEmitter<any>();
  constructor(
    private projectSvc: ProjectService,
    private dataService: DataService,
    private ngZone: NgZone,
    public events: EventsService,
    private elementRef: ElementRef
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editVariable']) {
      this.updateVariables();
    }

    if (changes.hasOwnProperty('isHidden')) {
      const hidden = changes['isHidden'].currentValue;
      if (hidden) {
        this.hiddenData();
      }
      this.isHidden = false;
    }
  }

  ngOnInit(): void {
    /*     setTimeout(() => {
      new Chart('myChart', {
        type: 'bar',

        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [
            {
              backgroundColor: '#8C64B1',
              label: '# of Votes',
              data: [12, 19, 3, 5, 2, 3],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }, 1000); */
    this.deleteShapeData();
    this.projectSvc.getProject(this.projectId).subscribe((res: any) => {
      this.variables = res.node;
    });

    if (this.editVariable) {
      let variable = this.tempObject[this.variableId];
      this.variableName = variable?.name;
      this.variableDescription = variable?.description;
    } else {
    }
  }

  togglePopover() {
    this.mostrarPopover = !this.mostrarPopover;
    setTimeout(() => {
      this.closeToogle = this.mostrarPopover;
    }, 100);
  }

  guardar() {
    console.log('Guardando:', this.inputValue);
    // Aquí puedes implementar la lógica para guardar los datos
    // por ejemplo, puedes hacer una llamada a una API
    this.mostrarPopover = false; // Oculta el popover después de guardar
  }

  cerrarPopover(event: MouseEvent) {
    if (this.closeToogle) {
      this.mostrarPopover = false;
      this.closeToogle = false;
    }
  }

  // @HostListener('document:click', ['$event'])
  // onClick(event: MouseEvent) {
  //   this.cerrarPopover(event);
  // }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const clickedInside = this.popover?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.cerrarPopover(event);
    }
  }

  ngAfterViewInit() {
    const modal = new bootstrap.Modal(this.miModal.nativeElement);

    modal._element.addEventListener('shown.bs.modal', async () => {
      this.ngZone.run(() => {
        try {
          this.shapeData = this.getItem('shapeData');

          this.min = this.shapeData.__zone_symbol__value.min
            ? this.shapeData.__zone_symbol__value.min
            : this.min;

          this.stDev = this.shapeData.__zone_symbol__value.stDev
            ? this.shapeData.__zone_symbol__value.stDev
            : this.stDev;

          this.max = this.shapeData.__zone_symbol__value.max
            ? this.shapeData.__zone_symbol__value.max
            : this.max;

          this.mean = this.shapeData.__zone_symbol__value.mean
            ? this.shapeData.__zone_symbol__value.mean
            : this.mean;

          this.rate = this.shapeData.__zone_symbol__value.rate
            ? this.shapeData.__zone_symbol__value.rate
            : this.rate;

          const chartName = this.shapeData.__zone_symbol__value.name;

          if (this.chart) {
            this.chart.destroy();
          }

          switch (chartName) {
            case 'Normal':
              this.normalChart();
              break;
            case 'SyntaxError':
              this.normalChart();
              break;
            case 'Uniforme':
              this.uniformChart();
              break;
            case 'Exponencial':
              this.exponentialChart();
              break;
            default:
              console.error(`Tipo de gráfico no reconocido: ${chartName}`);
          }
        } catch (error) {
          console.error("Error al obtener o procesar 'shapeData':", error);
        }
      });
      if (!this.nodeId) {
        this.updateVariables();
      }
      this.projectSvc.getProject(this.projectId).subscribe((res: any) => {
        this.variables = res.nodes;
      });
    });

    modal._element.addEventListener('hidden.bs.modal', () => {
      /*       if (!this.editVariable) {
        this.variableSelect1 = '';
        this.variableSelect2 = '';
        this.variableName = '';
        this.variableDescription = '';
        this.variableUnidad = undefined;
        this.editVariableName = false;
        this.editVariableDescription = false;
        this.editVariableUnidad = false;
        this.isOperation = false;
        this.constante = true;
        this.calculos = [];
        this.sendOperations = [];
        this.showNewEscenario = [];
      } else {
        this.variableSelect1 = '';
        this.variableSelect2 = '';
        this.variableDescription = '';
        this.variableUnidad = undefined;
        this.variableName = '';
        this.editVariableName = false;
        this.editVariableDescription = false;
        this.editVariableUnidad = false;
        this.isOperation = false;
        this.constante = true;
        this.calculos = [];
        this.sendOperations = [];
        this.showNewEscenario = [];
        this.variableUnidad = undefined;
        this.min = 0;
        this.max = 0;
        this.stDev = 0;
      } */
    });
  }
  editVariableNameClick() {
    this.editVariableName = !this.editVariableName;
  }

  editVariableDescriptionClick() {
    this.editVariableDescription = !this.editVariableDescription;
  }

  editVariableAll() {
    this.editVariableDescription = true;
  }

  sendData() {
    this.sendDataEvent.emit({
      name: this.variableName,
      description: this.variableDescription,
      operation: !this.constante,
      constante: this.constante,
      formula: this.sendOperations,
      unite: this.variableUnidad,
      distribution_shape: [
        {
          name:
            this.shapeData.__zone_symbol__value.name !== 'SyntaxError'
              ? this.shapeData.__zone_symbol__value.name
              : 'Normal',
          max: +this.max,
          stDev: +this.stDev,
          min: +this.min,
          rate: +this.rate,
          mean: +this.mean,
          type: this.shapeData.__zone_symbol__value.type,
        },
      ],
    });
    console.log(
      {
        name: this.variableName,
        description: this.variableDescription,
        operation: !this.constante,
        constante: this.constante,
        formula: this.sendOperations,
        unite: this.variableUnidad,
        distribution_shape: [
          {
            name:
              this.shapeData.__zone_symbol__value.name !== 'SyntaxError'
                ? this.shapeData.__zone_symbol__value.name
                : 'Normal',
            max: +this.max,
            stDev: +this.stDev,
            rate: +this.rate,
            mean: +this.mean,
            min: +this.min,
            type: this.shapeData.__zone_symbol__value.type,
          },
        ],
      },
      'DATA SENDIADA'
    );
    this.cerrarModal();
    this.sendOperations = [];
    this.tempObject.push({
      name: this.variableName,
      description: this.variableDescription,

      operation: !this.constante,
      constante: this.constante,
    });
  }
  editData() {
    this.editDataEvent.emit({
      id: this.nodeId,
      name: this.variableName,
      description: this.variableDescription,
      formula: this.sendOperations ? this.sendOperations : null,
      operation: !this.constante,
      constante: this.constante,
      unite: this.variableUnidad,
      distribution_shape: [
        {
          name:
            this.shapeData.__zone_symbol__value.name !== 'SyntaxError'
              ? this.shapeData.__zone_symbol__value.name
              : 'Normal',
          max: +this.max,
          stDev: +this.stDev,
          min: +this.min,
          mean: this.mean,
          rate: this.rate,
          type: this.shapeData.__zone_symbol__value.type,
        },
      ],
    });

    this.cerrarModal();

    this.tempObject[this.variableId] = {
      name: this.variableName,
      description: this.variableDescription,

      operation: !this.constante,
      constante: this.constante,
    };
  }
  cerrarModal() {
    // Obtén el botón que tiene el atributo data-bs-dismiss dentro del modal
    const closeButton = document.querySelector('[data-bs-dismiss="modal"]');

    // Verifica si el botón existe antes de intentar cerrar el modal
    if (closeButton) {
      // Simula un clic en el botón para cerrar el modal
      (closeButton as HTMLElement).click();
    }
  }

  submit() {
    if (this.editVariable) {
      if (this.disable()) {
        Swal.fire({
          title: 'Error',
          text: 'El nombre y la descripción son necesarios.',
          icon: 'error',
          iconColor: '#BC5800',
          customClass: {
            confirmButton: 'confirm',
            cancelButton: 'cancel',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const openButton = document.querySelector('#exampleModalButton');

            // Verifica si el botón existe antes de intentar cerrar el modal
            if (openButton) {
              // Simula un clic en el botón para cerrar el modal
              (openButton as HTMLElement).click();
            }
          }
        });
      } else {
        this.editData();
        this.deleteShapeData();
      }
    } else {
      if (this.disable()) {
        Swal.fire({
          title: 'Error',
          text: 'El nombre y la descripcion son necesarios.',
          icon: 'error',
          iconColor: '#BC5800',
          customClass: {
            confirmButton: 'confirm',
            cancelButton: 'cancel',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const openButton = document.querySelector('#exampleModalButton');

            // Verifica si el botón existe antes de intentar cerrar el modal
            if (openButton) {
              // Simula un clic en el botón para cerrar el modal
              (openButton as HTMLElement).click();
            }
          }
        });
      } else {
        this.sendData();
        this.deleteShapeData();
      }
    }
  }
  editVariableUnidadClick() {
    this.editVariableUnidad = !this.editVariableUnidad;
  }

  operation(id1: any, id2: any) {
    const unidad1 = this.onlyConst[+id1]?.unidad;
    const unidad2 = this.onlyConst[+id2]?.unidad;

    // Verificar si las propiedades existen antes de intentar acceder a ellas
    if (unidad1 !== undefined && unidad2 !== undefined) {
      return +unidad1 + +unidad2;
    } else {
      // Manejar el caso en que alguna de las propiedades es 'undefined'
      return 0;
    }
  }
  updateVariables(): void {
    /*     this.variables = this.variables.filter(
      (variable) => variable.id !== this.nodeId
    ); */

    if (this.editVariable) {
      this.projectSvc.getNode(this.nodeId).subscribe((res: any) => {
        this.variableUnidad = res.unite ? res.unite : undefined;

        const shapeDataExists = localStorage.getItem('shapeData') !== null;

        // Si shapeData no existe, entonces lo establecemos
        if (!shapeDataExists) {
          this.min = res.distribution_shape[0]?.min
            ? res.distribution_shape[0]?.min
            : this.min;
          this.mean = res.distribution_shape[0]?.mean
            ? res.distribution_shape[0]?.mean
            : this.mean;

          this.rate = res.distribution_shape[0]?.rate
            ? res.distribution_shape[0]?.rate
            : this.rate;

          this.max = res.distribution_shape[0]?.max
            ? res.distribution_shape[0]?.max
            : this.max;
          this.stDev = res.distribution_shape[0]?.stDev
            ? res.distribution_shape[0]?.stDev
            : this.stDev;

          const formShape = {
            min: this.min,
            stDev: this.stDev,
            max: this.max,
            rate: this.rate,
            mean: this.mean,
            name: res.distribution_shape[0]?.name
              ? res.distribution_shape[0]?.name
              : 'Normal',
            type: res.distribution_shape[0]?.type
              ? res.distribution_shape[0]?.type
              : 'static',
          };
          localStorage.setItem('shapeData', JSON.stringify(formShape));
          this.shapeData = this.getItem('shapeData');

          const chartName = res.distribution_shape[0]?.name
            ? res.distribution_shape[0]?.name
            : 'ANormal';

          if (this.chart) {
            this.chart.destroy();
          }

          switch (chartName) {
            case 'Normal':
              this.normalChart();
              break;
            case 'SyntaxError':
              this.normalChart();
              break;
            case 'Uniforme':
              this.uniformChart();
              break;
            case 'Exponencial':
              this.exponentialChart();
              break;
            default:
              console.error(`Tipo de gráfico no reconocido: ${chartName}`);
          }
        }
        this.constante = res.type === 1 ? true : false;
        this.oldType = res.type === 1 ? true : false;
        this.variableName = res.name;
        this.variableDescription = res.description;
        this.calculos = res.new_formula ? res.new_formula : [];
        this.sendOperations = res.formula ? res.formula : [];
        this.showNewEscenario = res.calculated ? res.calculated : [];
      });
    }
  }
  hiddenData() {
    this.hiddenDataEvent.emit();
  }
  disable() {
    if (this.variableName) {
      return false;
    } else {
      return true;
    }
  }

  arrayFilter(): Array<any> {
    this.onlyConst = this.tempObject.filter((obj) => obj.operation === false);
    return this.tempObject.filter((obj) => obj.operation === false);
  }

  addVariable(variable: any, id: any) {
    if (
      this.operators.includes(this.calculos[this.calculos.length - 1]?.name)
    ) {
      if (variable.type === 2) {
        [variable.calculated].forEach((e: any) => {
          e.operation = this.calculos[this.calculos.length - 1]?.name;
        });
      } else {
        [variable.sceneries].forEach((e: any) => {
          e.operation = this.calculos[this.calculos.length - 1]?.name;
        });
      }
    }

    this.calculos.push(variable.name);
    const variableTo =
      variable.type === 2 ? variable.calculated : variable.sceneries;
    this.operations.push(variableTo);

    this.calculos[this.calculos.length - 1];

    this.operationResult();
    this.sendOperations.push(id);
  }
  operationResult() {
    type YearValue = {
      [key: number]: string;
    };

    type Scenario = {
      name: string;
      years: YearValue[];
    };

    const newEscenario: any = [];
    const escenarios = JSON.parse(JSON.stringify(this.operations));

    for (let i = 0; i < escenarios.length; i++) {
      const element = escenarios[i];
      for (let i = 0; i < element.length; i++) {
        const element2 = element[i];
        const escenarioExiste = newEscenario.some(
          (objeto: any) => objeto.name === element2.name
        );
        if (this.operators.includes(element2.name)) {
          newEscenario.forEach((e: any) => {
            [e.years].forEach((year: any) => {
              Object.entries(year).forEach(([clave, valor]) => {
                [e.years][0][clave] = `${(valor as string) + element2.name}`;
                try {
                  [e.years][0][clave] = eval([e.years][0][clave]);
                } catch (error) {}
              });
            });
          });
        }

        if (!escenarioExiste && !this.operators.includes(element2.name)) {
          newEscenario.push({ name: element2.name, years: element2.years });
        } else if (!this.operators.includes(element2.name)) {
          const objetoConNombre = newEscenario.find(
            (obj: any) => obj.name === element2.name
          );
          [objetoConNombre.years].forEach((year: any) => {
            Object.entries(year).forEach(([clave, valor]) => {
              try {
                [objetoConNombre.years][0][clave] = eval(
                  `${(valor as string) + element2.years[clave as any]}`
                );
              } catch (error) {
                [objetoConNombre.years][0][clave] = `${
                  (valor as string) + element2.years[clave as any]
                }`;
              }
            });
          });
        }
      }
    }

    this.showNewEscenario = newEscenario;
  }

  addCalculo(operation: string) {
    if (this.sendOperations.length > 0) {
      this.calculos.push(operation);
      this.operations.push([{ name: operation }]);

      this.sendOperations.push(operation);
    }

    this.operationResult();
  }
  addCustom() {
    if (this.inputValue.toString().includes('%')) {
      const valueBase = parseFloat(this.inputValue.toString().replace('%', ''));

      this.inputValue = (+valueBase / 100).toString();
    }

    this.calculos.push(this.inputValue);
    this.operations.push([{ name: this.inputValue }]);

    this.sendOperations.push(this.inputValue);
    this.inputValue = '';
    this.mostrarPopover = false; //
  }

  seleccionarCalculo(calculo: any): void {
    this.selectedCalculo = calculo;
  }

  deseleccionarCalculo(): void {
    this.selectedCalculo = null;
  }
  eliminatedOperation(i: any) {
    this.calculos.splice(i, 1);
    this.operations.splice(i, 1);
    this.sendOperations.splice(i, 1);
  }
  submitEdit() {
    const editVariable = {
      name: this.variableName,
      description: this.variableDescription,
      formula: this.sendOperations,
    };

    this.projectSvc
      .updateNode(this.nodeId, editVariable)
      .subscribe((res: any) => {});
  }

  elimateNode() {
    Swal.fire({
      title: 'Estas seguro?',
      text: 'No podras revertir esta accion',
      icon: 'question',
      iconColor: '#BC5800',
      showCancelButton: true,
      confirmButtonText: 'Si, borrar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'confirm',
        cancelButton: 'cancel',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.projectSvc.deleteNode(this.nodeId).subscribe((res: any) => {
          this.deleteNode.emit();
          Swal.fire({
            title: 'Borrado!',
            text: 'El nodo fue borrado con exito!',
            icon: 'success',
          });
          this.deleteShapeData();
        });
      }

      if (result.isDenied) {
        const openButton = document.querySelector('#exampleModalButton');

        // Verifica si el botón existe antes de intentar cerrar el modal
        if (openButton) {
          // Simula un clic en el botón para cerrar el modal
          (openButton as HTMLElement).click();
        }
      }
      if (result.isDismissed) {
        const openButton = document.querySelector('#exampleModalButton');

        // Verifica si el botón existe antes de intentar cerrar el modal
        if (openButton) {
          // Simula un clic en el botón para cerrar el modal
          (openButton as HTMLElement).click();
        }
      }
    });
  }

  verifyType() {
    if (this.editVariable) {
      setTimeout(() => {
        if (this.oldType !== this.constante) {
          Swal.fire({
            title: 'Estas seguro?',
            text: 'Si cambias el tipo los datos asociados se perderan',
            icon: 'question',
            iconColor: '#BC5800',

            confirmButtonText: 'ok',
            customClass: {
              confirmButton: 'confirm',
              cancelButton: 'cancel',
            },
          });
        }
      }, 100);
    }
  }

  getItem(key: any) {
    return new Promise((resolve) => {
      const value = localStorage.getItem(key);
      const def =
        '{"name":"Normal","min":"0","max":"0","stDev":"0","rate":"0","mean":"0","type":"static"}';
      resolve(JSON.parse(value || def));
    });
  }

  normalChart() {
    this.chart = new Chart('myChart', {
      type: 'line',
      data: {
        labels: ['-', '-', '-', '-', '-'],
        datasets: [
          {
            backgroundColor: '#8C64B1',
            label: 'Normal',
            data: [0, 10, 19, 10, 0],
            fill: true,
            tension: 0.4,
            borderWidth: 1,
            pointHitRadius: 25, // for improved touch support
            // dragData: false // prohibit dragging this dataset
            // same as returning `false` in the onDragStart callback
            // for this datsets index position
          },
        ],
      },
      options: {
        plugins: {},
        scales: {
          y: {
            // dragData: false // disables datapoint dragging for the entire axis
          },
        },
      },
    });
  }

  uniformChart() {
    this.chart = new Chart('myChart', {
      type: 'line',
      data: {
        labels: ['-', '-', '-', '-', '-'],
        datasets: [
          {
            backgroundColor: '#8C64B1',
            label: 'Uniforme',
            data: [19, 19, 19, 19, 19],
            fill: true,
            tension: 0.4,
            borderWidth: 1,
            pointHitRadius: 25, // for improved touch support
            // dragData: false // prohibit dragging this dataset
            // same as returning `false` in the onDragStart callback
            // for this datsets index position
          },
        ],
      },
      options: {
        plugins: {},
        scales: {
          y: {
            // dragData: false // disables datapoint dragging for the entire axis
          },
        },
      },
    });
  }

  exponentialChart() {
    this.chart = new Chart('myChart', {
      type: 'line',
      data: {
        labels: ['-', '-', '-', '-', '-'],
        datasets: [
          {
            backgroundColor: '#8C64B1',
            label: 'Exponencial',
            data: [19, 12, 7, 2, 0],
            fill: true,
            tension: 0.4,
            borderWidth: 1,
            pointHitRadius: 25, // for improved touch support
            // dragData: false // prohibit dragging this dataset
            // same as returning `false` in the onDragStart callback
            // for this datsets index position
          },
        ],
      },
      options: {
        plugins: {},
        scales: {
          y: {
            // dragData: false // disables datapoint dragging for the entire axis
          },
        },
      },
    });
  }

  deleteShapeData() {
    localStorage.removeItem('shapeData');
    localStorage.removeItem('shapetype');

    this.variableSelect1 = '';
    this.variableSelect2 = '';
    this.variableDescription = '';
    this.variableUnidad = undefined;
    this.variableName = '';
    this.editVariableName = false;
    this.editVariableDescription = false;
    this.editVariableUnidad = false;
    this.isOperation = false;
    this.constante = true;
    this.calculos = [];
    this.sendOperations = [];
    this.showNewEscenario = [];
    this.variableUnidad = undefined;
    this.min = 0;
    this.max = 0;
    this.stDev = 0;
    this.mean = 0;
    this.rate = 0;
  }

  saveNewValue() {
    this.events.publish('changeEditUnite', this.variableUnidad);
  }

  removeStorage() {
    localStorage.removeItem('shapeData');
    localStorage.removeItem('shapetype');
  }

  setEvent() {
    setTimeout(() => {
      var evt = new Event('change');
      var elem = document.getElementById(
        'escenarios-select'
      ) as HTMLSelectElement;
      elem.selectedIndex = 1;
      elem.dispatchEvent(evt);
    }, 100);
  }
}
