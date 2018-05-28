namespace override {

    export class Top extends Middle {
        
        /**
         * Should fail.
         */
        public hello5 = 123;

        @override public hello2() {

        }
        
        public hello6() {
            
        }

    }

}