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

import Person from "@material-ui/icons/Person"
import BubbleChart from "@material-ui/icons/BubbleChart";
import Detail from "@material-ui/icons/Explore"

import LatestTokens from "views/LatestTokens/LatestTokens.jsx";
import MyTokens from "views/MyTokens/MyTokens.jsx";
import TokenDetail from "views/TokenDetail/TokenDetail.jsx";

const dashboardRoutes = [{
        path: "latest",
        name: "latest_token",
        icon: BubbleChart,
        component: LatestTokens,
        layout: "/"
    },
    {
        path: "mine",
        name: "my_token",
        icon: Person,
        component: MyTokens,
        layout: "/"
    },
    {
        path: "detail",
        name: "token_detail",
        icon: Detail,
        component: TokenDetail,
        layout: "/"
    }
];

export default dashboardRoutes;