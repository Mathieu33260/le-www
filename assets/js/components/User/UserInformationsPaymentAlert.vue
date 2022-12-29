<template v-if="userInfos">
<span class="badge alert-danger" v-cloak v-if="'nbPyAwaiting' in userInfos && userInfos.nbPyAwaiting">
    {{ userInfos.nbPyPending + userInfos.nbPyAwaiting }}
</span>
<span class="badge alert-danger" v-cloak v-else-if="'nbPyPending' in userInfos && userInfos.nbPyPending > 0">
    {{ userInfos.nbPyPending }}
</span>
</template>

<script>
import { mapGetters } from "vuex"

export default {
    name: 'UserInformationsPaymentAlert',
    computed: Object.assign({},
    mapGetters('UserDatas', {
        userInfos: 'userInfos',
    })),
}
</script>
