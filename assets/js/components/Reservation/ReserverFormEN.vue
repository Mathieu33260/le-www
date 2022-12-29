<template>
<div v-cloak>
    <div v-for="(row, index) in rows" :key="index">
        <a class="editForm" v-if="index > 0" @click="removeRow(row)">
            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
        </a>
        <h3>Personne {{ index+1 }}</h3>
        <div class="form-group">
            <label :for="'civilite' + index" class="col-sm-3 control-label">Civilité*</label>
            <div class="col-sm-6">
            <select
                :id="'civilite' + index"
                :name="'civilite' + index"
                class="form-control"
                required
                v-model="row.civility"
            >
                <option selected>M</option>
                <option>Mme</option>
            </select>
            </div>
        </div>
        <div class="form-group">
            <label :for="'lastName' + index" class="col-sm-3 control-label">Nom*</label>
            <div class="col-sm-6">
            <input
                type="text"
                class="form-control"
                :id="'lastName' + index"
                :name="'lastName' + index"
                placeholder="Nom"
                required
                title="nom"
                v-model="row.lastname"
            >
            </div>
        </div>
        <div class="form-group">
            <label :for="'firstName' + index" class="col-sm-3 control-label">Prénom*</label>
            <div class="col-sm-6">
            <input
                type="text"
                class="form-control"
                :id="'firstName' + index"
                :name="'firstName' + index"
                placeholder="Prénom"
                required
                title="prénom"
                v-model="row.firstname"
            >
            </div>
        </div>
        <div class="form-group" :class="{ 'has-error': row.birthDateError }">
            <label :for="'birthDate' + index" class="col-sm-3 control-label">Date de naissance*</label>
            <div class="col-sm-6">
            <input
                type="text"
                class="form-control"
                :id="'birthDate' + index"
                :name="'birthDate' + index"
                placeholder="JJ/MM/AAAA"
                required
                title="Date de naissance"
                v-model="row.birthDate"
                pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                v-on:keyup="keyUp(row, $event)"
                v-on:keypress="keyPress(row, $event)"
                v-on:blur="blur(row)"
            >
            </div>
            <span
            class="col-sm-3 help-block"
            :class="{ 'hide': !row.birthDateError }"
            >Date de naissance invalide</span>
        </div>
        <input type="text" style="display: none" name="nbPassenger" :value="index">
    </div>
    <a class="editForm" v-if="sendIndex() < nbPassenger" @click="addRow">
        <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Ajouter
    </a>
</div>
</template>

<script>
export default {
    name: "ReserverFormEN",
    props: {
        nbPassenger: Number,
    },
    data() {
        return {
            pop: 1,
            rows: [
                {
                    civility: "",
                    lastname: "",
                    firstname: "",
                    birthDate: "",
                    birthDateError: false,
                },
                {
                    civility: "",
                    lastname: "",
                    firstname: "",
                    birthDate: "",
                    birthDateError: false,
                },
            ],
        }
    },
    methods: {
        addRow() {
            this.rows.push({
                civility: "",
                lastname: "",
                firstname: "",
                birthDate: "",
                birthDateError: false,
            });
            this.pop++;
        },
        removeRow(row) {
            this.rows.splice(row, 1);
            this.pop--;
        },
        sendIndex() {
            return this.pop + 1;
        },
        keyUp(row, e) {
            const val = row.birthDate;
            const nbCar = val.length;
            if (nbCar === 2 || nbCar === 5) {
                if (e.key !== "Backspace" && e.key !== "Delete") {
                row.birthDate = val + "/";
                } else {
                row.birthDate = val.substr(0, val.length - 1);
                }
            }
            this.$forceUpdate();
            if (val.length === 10) {
                const birth = row.birthDate.split("/");
                if (
                birth.length !== 3
                || birth[0].length !== 2
                || birth[1].length !== 2
                || birth[2].length !== 4
                ) {
                row.birthDateError = true;
                } else {
                    const trueBirth = new Date(birth[2] + "/" + birth[1] + "/" + birth[0]);
                    if (
                        trueBirth === "Invalid Date"
                        || trueBirth.getDate() !== birth[0]
                        || trueBirth.getMonth() + 1 !== birth[1]
                        || trueBirth.getFullYear() !== birth[2]
                    ) {
                        row.birthDateError = true;
                    } else {
                        row.birthDateError = false;
                    }
                }
            } else if (row.birthDate.length > 10) {
                row.birthDateError = true;
            }
        },
        keyPress(row, e) {
            if (e.key === "/" || (row.birthDate.length === 10 && e.key.length === 1)) {
                e.preventDefault();
            }
        },
        blur(row) {
            const val = row.birthDate;
            if (val.length === 10) {
                const birth = row.birthDate.split("/");
                if (
                    birth.length !== 3
                    || birth[0].length !== 2
                    || birth[1].length !== 2
                    || birth[2].length !== 4
                ) {
                    row.birthDateError = true;
                } else {
                    const trueBirth = new Date(birth[2] + "/" + birth[1] + "/" + birth[0]);
                    if (
                        trueBirth === "Invalid Date"
                        || trueBirth.getDate() !== birth[0]
                        || trueBirth.getMonth() + 1 !== birth[1]
                        || trueBirth.getFullYear() !== birth[2]
                    ) {
                        row.birthDateError = true;
                    } else {
                        row.birthDateError = false;
                    }
                }
            } else {
                row.birthDateError = true;
            }
        },
    },
};
</script>
