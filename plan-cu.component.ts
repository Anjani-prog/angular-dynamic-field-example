

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PlanService } from '../plan.service';
import { StagesService } from '../../stages/stages.service';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
    selector: 'app-plan-cu',
    templateUrl: '../pages/plan-cu.component.html',
})

export class PlanCuComponent implements OnInit {
    planForm: FormGroup;
    submitted = false;
    planId: string;
    actionType = 'Add';
    loading = false;
    loadingFrm = true; // used to hide edit form while fetching
    plan: any = {};
    stages: any = [];
    errors: string;
    myFormValueChanges$;

    constructor(
        private planService: PlanService,
        private stageservice: StagesService,
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder) { }

    public getstages() {
        this.stageservice.getStages().subscribe((data: any) => {
            this.stages = data;
        });
    }
    private getUnit() {
        return this.formBuilder.group({
            stage: ['', Validators.required],
        });
    }
    ngOnInit() {
        this.getstages();
        this.planForm = this.formBuilder.group({
            id: [''],
            plantypes: ['', Validators.required],
            name: ['', Validators.required],
            description: [''],
            cost: ['', [Validators.required, Validators.pattern('^[0-9]{0,50}$')]],
            status: ['', Validators.required],
            units: this.formBuilder.array([
                // this.getUnit() // for dynamic fields
            ])
        });
        // initialize stream on units
        this.myFormValueChanges$ = this.planForm.controls['units'].valueChanges;
        // subscribe to the stream so listen to changes on units
        this.planId = this.route.snapshot.paramMap.get('id');
        if (this.planId) {
            this.actionType = 'Update';
            this.loadingFrm = false;
            this.planService.getPlan(this.planId)
                .subscribe(data => {
                    this.loadingFrm = true; // show edit form
                    this.planForm.patchValue(data);
                    const planexecutionstages = data['planexecutionstages'];
                    // for dynamic fields get value for update
                    if (planexecutionstages) {
                        const control = this.planForm.controls['units'] as FormArray;
                        planexecutionstages.forEach(stages => {
                            const formBuilder = this.getUnit();
                            formBuilder.patchValue({ stage: stages['executionstages'] });
                            control.push(formBuilder);
                        });
                    }
                });
        }
    }
    // convenience getter for easy access to form fields
    get f() { return this.planForm.controls; }
    private addUnit() {
        const control = this.planForm.controls['units'] as FormArray;
        control.push(this.getUnit());
    }

    /**
     * Remove unit row from form on click delete button
     */
    private removeUnit(i: number) {
        const control = this.planForm.controls['units'] as FormArray;
        control.removeAt(i);
    }
    stageat(index) {
        return (this.planForm.get('units') as FormArray).at(index);
    }

    onSubmit() {
        this.submitted = true;
        // stop here if form is invalid
        if (this.planForm.invalid) {
            return;
        }
        // alert('SUCCESS!! :-)\n\n' + JSON.stringify(this.planForm.value));
        this.loading = true;
        let myhttpService;
        if (this.actionType === 'Add') {
            myhttpService = this.planService.postPlan(this.planForm.value);
        } else if (this.actionType === 'Update') {
            myhttpService = this.planService.updatePlan(this.planId, this.planForm.value);
        }

        myhttpService.subscribe((response) => {
            this.router.navigate(['/company/plans/']);
        }, // success
            error => {
                this.errors = error;
                this.loading = false;
            }
        );
    }
}
