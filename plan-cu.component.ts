import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamShedulesService } from '../examshedules.service';
import { ClassesService } from '../../../academics/classes/classes.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
    selector: 'app-examshedules-cu',
    templateUrl: '../pages/examshedules-cu.component.html'
})

export class ExamShedulesCuComponent implements OnInit, OnDestroy {
    examsheduleForm: FormGroup;
    submitted = false;
    examsheduleId: string;
    action_type = 'Add';
    form_action = 'Save';
    loading = false;
    loading_frm = true; // used to hide edit form while fetching
    classes: any = [];
    errors: string;
    myFormValueChanges$;
    id: string;
    subjects: any = [];
    // if(date) {
    //     this.examshedule.date = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    // }


    constructor(
        private toastr: ToastrService,
        private examsheduleService: ExamShedulesService,
        private classesservice: ClassesService,

        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder) { }

    public getclasses() {
        this.classesservice.getClassess().subscribe((data: any) => {
            this.classes = data;


        });
    }
    public getSubjects() {
        const value = this.examsheduleForm.get('clas').value;
        this.examsheduleService.getSubjects(value).subscribe((data: Array<object>) => {
            this.subjects = data;

        });
    }
    private getUnit() {
        return this.formBuilder.group({
            subject: ['', Validators.required],
            date: ['', Validators.required],
            starting_time: ['', Validators.required],
            ending_time: ['', Validators.required],
        });
    }

    ngOnInit() {
        this.getclasses();
        this.examsheduleForm = this.formBuilder.group({
            id: [''],
            name: ['', Validators.required],
            clas: ['', Validators.required],
            status: ['', Validators.required],
            units: this.formBuilder.array([
            ])
        });
        // initialize stream on units
        this.myFormValueChanges$ = this.examsheduleForm.controls['units'].valueChanges;
        // subscribe to the stream so listen to changes on units
        this.examsheduleId = this.route.snapshot.paramMap.get('id');
        if (this.examsheduleId) {
            this.action_type = 'Update';
            this.loading_frm = false;
            this.examsheduleService.getExamShedule(this.examsheduleId)
                .subscribe(data => {
                    this.loading_frm = true; // show edit form
                    this.examsheduleForm.patchValue(data);
                    const examshedulefields = data['examshedulefields'];
                    this.getSubjects();
                    // for dynamic fields get value for update
                    if (examshedulefields) {
                        const control = this.examsheduleForm.controls['units'] as FormArray;
                        examshedulefields.forEach(stages => {
                            const formBuilder = this.getUnit();
                            formBuilder.patchValue({ subject: stages['exam_subject'] });
                            formBuilder.patchValue({ date: moment(stages['date']).format('DD/MM/YYYY') });
                            formBuilder.patchValue({ starting_time: stages['starting_time'] });
                            formBuilder.patchValue({ ending_time: stages['ending_time'] });
                            control.push(formBuilder);
                        });
                    }
                });
        }

    }

    get f() { return this.examsheduleForm.controls; }
    ngOnDestroy(): void {
        // Do not forget to unsubscribe the event
    }

    disablegradeType(action_type: any) {
        if (action_type === 'Update') {
            return 'true';
        }
        return 'false';
    }
    addUnit() {
        const control = this.examsheduleForm.controls['units'] as FormArray;
        control.push(this.getUnit());
    }

    /**
     * Remove unit row from form on click delete button
     */
    removeUnit(i: number) {
        const control = this.examsheduleForm.controls['units'] as FormArray;
        control.removeAt(i);
    }


    onSubmit() {
        this.submitted = true;
        // stop here if form is invalid
        if (this.examsheduleForm.invalid) {
            return;
        }
        // alert('SUCCESS!! :-)\n\n' + JSON.stringify(this.examsheduleForm.value));
        this.loading = true;
        let myhttpService;
        if (this.action_type === 'Add') {
            myhttpService = this.examsheduleService.postExamShedule(this.examsheduleForm.value);
        } else if (this.action_type === 'Update') {
            myhttpService = this.examsheduleService.updateExamShedule(this.examsheduleId, this.examsheduleForm.value);
        }

        myhttpService.subscribe((response) => {
            this.router.navigate(['/academics/examshedule/']);
        }, // success
            error => {
                this.errors = error;
                this.loading = false;
            }
        );
    }
}
