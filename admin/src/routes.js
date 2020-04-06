/* !

=========================================================
* Material Dashboard React - v1.7.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. */
// @material-ui/icons

import LibraryBooks from "@material-ui/icons/LibraryBooks";
import HowToReg from "@material-ui/icons/HowToReg";
import BubbleChart from "@material-ui/icons/BubbleChart";
import Unarchive from "@material-ui/icons/Unarchive";

import CreateToken from "views/CreateToken/CreateToken.jsx";
import AllTokens from "views/AllTokens/AllTokens.jsx";
import OwnerAdmin from "views/OwnerAdmin/OwnerAdmin.jsx";
import TokenDetail from "views/TokenDetail/TokenDetail.jsx";

const dashboardRoutes = [{
        path: "all",
        name: "all_token",
        icon: LibraryBooks,
        component: AllTokens,
        layout: "/"
    },
    {
        path: "create",
        name: "create_token",
        icon: BubbleChart,
        component: CreateToken,
        layout: "/"
    },
    {
        path: "owner",
        name: "owner_admin",
        icon: HowToReg,
        component: OwnerAdmin,
        layout: "/"
    },
    {
        path: "detail",
        name: "token_detail",
        icon: Unarchive,
        component: TokenDetail,
        layout: "/"
    }
];

export default dashboardRoutes;